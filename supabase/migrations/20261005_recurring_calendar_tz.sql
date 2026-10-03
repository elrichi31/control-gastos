BEGIN;

-- 1) Local calendar day. Cron and edits used UTC, so charges appeared the evening
-- before (01:00 UTC = 20:00 in Ecuador) and night edits could skip today's charge.
-- ponytail: single app-wide zone; add a per-user zone column if users span time zones.
CREATE OR REPLACE FUNCTION public.app_today()
RETURNS date LANGUAGE sql STABLE SET search_path = pg_catalog, public AS $$
  SELECT (now() AT TIME ZONE 'America/Guayaquil')::date
$$;

-- 2) Yearly rules need a month. Monthly/yearly days now accept 29-31: a shorter
-- month falls on its last day (31 = "último día del mes").
ALTER TABLE public.gasto_recurrente ADD COLUMN IF NOT EXISTS mes_anual smallint;
DO $$
DECLARE c record; t regtype;
BEGIN
  -- Legacy CHECKs limiting frecuencia or dia_mes to 1-28 would reject the new calendar.
  FOR c IN SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.gasto_recurrente'::regclass AND contype = 'c'
      AND (pg_get_constraintdef(oid) ILIKE '%frecuencia%' OR pg_get_constraintdef(oid) ILIKE '%dia_mes%')
  LOOP EXECUTE format('ALTER TABLE public.gasto_recurrente DROP CONSTRAINT %I', c.conname); END LOOP;
  SELECT atttypid::regtype INTO t FROM pg_attribute WHERE attrelid = 'public.gasto_recurrente'::regclass AND attname = 'frecuencia';
  IF EXISTS (SELECT 1 FROM pg_type WHERE oid = t AND typtype = 'e') THEN
    EXECUTE format('ALTER TYPE %s ADD VALUE IF NOT EXISTS %L', t, 'anual');
  END IF;
END $$;
ALTER TABLE public.gasto_recurrente ADD CONSTRAINT gasto_recurrente_calendar_check CHECK (
  (frecuencia::text = 'semanal' AND dia_semana BETWEEN 1 AND 7) OR
  (frecuencia::text = 'mensual' AND dia_mes BETWEEN 1 AND 31) OR
  (frecuencia::text = 'anual' AND dia_mes BETWEEN 1 AND 31 AND mes_anual BETWEEN 1 AND 12)
) NOT VALID;

CREATE OR REPLACE FUNCTION public.recurring_next_date(p_from date, p_frequency text, p_month_day integer, p_week_day integer, p_month integer)
RETURNS date LANGUAGE plpgsql IMMUTABLE SET search_path = pg_catalog, public AS $$
DECLARE m date; candidate date;
BEGIN
  IF p_from IS NULL THEN RAISE EXCEPTION 'fecha_inicio obligatoria' USING ERRCODE = '22023'; END IF;
  IF p_frequency = 'semanal' AND p_week_day BETWEEN 1 AND 7 THEN
    RETURN p_from + ((p_week_day - extract(isodow FROM p_from)::integer + 7) % 7);
  ELSIF p_frequency = 'mensual' AND p_month_day BETWEEN 1 AND 31 THEN
    m := date_trunc('month', p_from)::date;
    candidate := m + least(p_month_day, extract(day FROM (m + interval '1 month - 1 day'))::integer) - 1;
    IF candidate < p_from THEN
      m := (m + interval '1 month')::date;
      candidate := m + least(p_month_day, extract(day FROM (m + interval '1 month - 1 day'))::integer) - 1;
    END IF;
    RETURN candidate;
  ELSIF p_frequency = 'anual' AND p_month_day BETWEEN 1 AND 31 AND p_month BETWEEN 1 AND 12 THEN
    m := make_date(extract(year FROM p_from)::integer, p_month, 1);
    candidate := m + least(p_month_day, extract(day FROM (m + interval '1 month - 1 day'))::integer) - 1;
    IF candidate < p_from THEN
      m := (m + interval '1 year')::date;
      candidate := m + least(p_month_day, extract(day FROM (m + interval '1 month - 1 day'))::integer) - 1;
    END IF;
    RETURN candidate;
  END IF;
  RAISE EXCEPTION 'calendario recurrente inválido (semanal 1-7, mensual 1-31, anual mes 1-12 y día 1-31)' USING ERRCODE = '22023';
END $$;

CREATE OR REPLACE FUNCTION public.recurring_schedule_rule()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE base date;
BEGIN
  IF NEW.frecuencia::text <> 'anual' THEN NEW.mes_anual := NULL; END IF;
  PERFORM public.recurring_next_date(NEW.fecha_inicio::date, NEW.frecuencia::text, NEW.dia_mes::integer, NEW.dia_semana::integer, NEW.mes_anual::integer);
  IF NEW.fecha_fin IS NOT NULL AND NEW.fecha_fin::date < NEW.fecha_inicio::date THEN
    RAISE EXCEPTION 'fecha_fin debe ser posterior o igual a fecha_inicio' USING ERRCODE = '22023';
  END IF;
  IF NEW.monto IS NULL OR NEW.monto <= 0 OR NEW.monto::text IN ('NaN','Infinity','-Infinity') THEN
    RAISE EXCEPTION 'monto debe ser positivo y finito' USING ERRCODE = '22023';
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.ultima_fecha_generada := NULL;
    NEW.proxima_fecha := public.recurring_next_date(NEW.fecha_inicio::date, NEW.frecuencia::text, NEW.dia_mes::integer, NEW.dia_semana::integer, NEW.mes_anual::integer);
  ELSIF NEW.frecuencia IS DISTINCT FROM OLD.frecuencia OR NEW.dia_mes IS DISTINCT FROM OLD.dia_mes
    OR NEW.dia_semana IS DISTINCT FROM OLD.dia_semana OR NEW.mes_anual IS DISTINCT FROM OLD.mes_anual
    OR NEW.fecha_inicio IS DISTINCT FROM OLD.fecha_inicio
    OR NEW.fecha_fin IS DISTINCT FROM OLD.fecha_fin OR (NEW.activo AND NOT OLD.activo) THEN
    -- Edits/resume affect today forward; paused or already consumed dates are not replayed.
    base := greatest(NEW.fecha_inicio::date, public.app_today(), NEW.ultima_fecha_generada + 1);
    NEW.proxima_fecha := public.recurring_next_date(base, NEW.frecuencia::text, NEW.dia_mes::integer, NEW.dia_semana::integer, NEW.mes_anual::integer);
  END IF;
  IF NEW.fecha_fin IS NOT NULL AND NEW.proxima_fecha > NEW.fecha_fin::date THEN NEW.proxima_fecha := NULL; END IF;
  RETURN NEW;
END $$;

-- Dropped and recreated so p_today can default to the local day (NULL -> app_today()).
DROP FUNCTION IF EXISTS public.process_recurring_expenses(date, integer);
CREATE FUNCTION public.process_recurring_expenses(p_today date DEFAULT NULL, p_limit integer DEFAULT 200)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE r public.gasto_recurrente%ROWTYPE; next_date date; created integer := 0; processed integer := 0; inserted integer;
BEGIN
  p_today := coalesce(p_today, public.app_today());
  IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'Fecha o límite inválido' USING ERRCODE = '22023';
  END IF;
  FOR r IN SELECT * FROM public.gasto_recurrente WHERE activo AND proxima_fecha <= p_today
    ORDER BY proxima_fecha, id LIMIT p_limit FOR UPDATE SKIP LOCKED LOOP
    WHILE r.proxima_fecha IS NOT NULL AND r.proxima_fecha <= p_today AND processed < p_limit LOOP
      INSERT INTO public.gasto(user_id, descripcion, monto, categoria_id, metodo_pago_id, fecha, is_recurrent, gasto_recurrente_id)
        VALUES(r.user_id, r.descripcion, r.monto, r.categoria_id, r.metodo_pago_id, r.proxima_fecha, true, r.id)
        ON CONFLICT (gasto_recurrente_id, fecha) WHERE gasto_recurrente_id IS NOT NULL DO NOTHING;
      GET DIAGNOSTICS inserted = ROW_COUNT;
      created := created + inserted;
      processed := processed + 1;
      next_date := public.recurring_next_date(r.proxima_fecha + 1, r.frecuencia::text, r.dia_mes::integer, r.dia_semana::integer, r.mes_anual::integer);
      IF r.fecha_fin IS NOT NULL AND next_date > r.fecha_fin::date THEN next_date := NULL; END IF;
      UPDATE public.gasto_recurrente SET ultima_fecha_generada=r.proxima_fecha, proxima_fecha=next_date WHERE id=r.id;
      r.proxima_fecha := next_date;
    END LOOP;
    EXIT WHEN processed >= p_limit;
  END LOOP;
  RETURN jsonb_build_object('created', created, 'processed', processed, 'pending', EXISTS(
    SELECT 1 FROM public.gasto_recurrente WHERE activo AND proxima_fecha <= p_today), 'date', p_today);
  -- No swallowed exceptions: a later failure rolls back the entire batch and its cursors.
END $$;
REVOKE ALL ON FUNCTION public.process_recurring_expenses(date, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_recurring_expenses(date, integer) TO service_role;

-- Every caller now uses the 5-argument calendar.
DROP FUNCTION IF EXISTS public.recurring_next_date(date, text, integer, integer);

NOTIFY pgrst, 'reload schema';
COMMIT;
