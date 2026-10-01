BEGIN;

-- Keep legacy instances as historical evidence; never generate new pending instances.
ALTER TABLE public.gasto_recurrente ADD COLUMN IF NOT EXISTS proxima_fecha date;
ALTER TABLE public.gasto_recurrente ADD COLUMN IF NOT EXISTS ultima_fecha_generada date;
ALTER TABLE public.gasto ADD COLUMN IF NOT EXISTS gasto_recurrente_id bigint
  REFERENCES public.gasto_recurrente(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.recurring_next_date(p_from date, p_frequency text, p_month_day integer, p_week_day integer)
RETURNS date LANGUAGE plpgsql IMMUTABLE SET search_path = pg_catalog, public AS $$
DECLARE candidate date;
BEGIN
  IF p_from IS NULL THEN RAISE EXCEPTION 'fecha_inicio obligatoria' USING ERRCODE = '22023'; END IF;
  IF p_frequency = 'semanal' AND p_week_day BETWEEN 1 AND 7 THEN
    RETURN p_from + ((p_week_day - extract(isodow FROM p_from)::integer + 7) % 7);
  ELSIF p_frequency = 'mensual' AND p_month_day BETWEEN 1 AND 28 THEN
    candidate := date_trunc('month', p_from)::date + (p_month_day - 1);
    IF candidate < p_from THEN candidate := (date_trunc('month', p_from) + interval '1 month')::date + (p_month_day - 1); END IF;
    RETURN candidate;
  END IF;
  RAISE EXCEPTION 'calendario recurrente inválido (mensual 1-28 o semanal 1-7)' USING ERRCODE = '22023';
END $$;

-- Refuse ambiguous/cross-owner historical links rather than silently assigning them.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.gasto_recurrente_instancia WHERE gasto_id IS NOT NULL GROUP BY gasto_id HAVING count(DISTINCT gasto_recurrente_id) > 1)
    OR EXISTS (SELECT 1 FROM public.gasto_recurrente_instancia i JOIN public.gasto g ON g.id=i.gasto_id JOIN public.gasto_recurrente r ON r.id=i.gasto_recurrente_id WHERE g.user_id::text <> r.user_id::text)
  THEN RAISE EXCEPTION 'Revisar enlaces históricos ambiguos o de distintos usuarios antes de migrar'; END IF;
END $$;

-- Link one canonical expense per rule/date. Existing duplicates remain untouched and
-- can still resolve their rule through the legacy recurring-info lookup.
UPDATE public.gasto g SET gasto_recurrente_id = linked.gasto_recurrente_id
FROM (
  SELECT DISTINCT ON (i.gasto_recurrente_id, g.fecha) g.id, i.gasto_recurrente_id
  FROM public.gasto_recurrente_instancia i JOIN public.gasto g ON g.id=i.gasto_id
  ORDER BY i.gasto_recurrente_id, g.fecha, g.id
) linked WHERE g.id=linked.id AND g.gasto_recurrente_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS gasto_recurring_date_unique
  ON public.gasto(gasto_recurrente_id, fecha) WHERE gasto_recurrente_id IS NOT NULL;

-- Recover explicitly pending dates, but never invent an unbounded historical backlog.
-- A consumed watermark survives deleting individual expenses after this migration.
UPDATE public.gasto_recurrente r SET ultima_fecha_generada = history.last_date,
  proxima_fecha = public.recurring_next_date(
    greatest(r.fecha_inicio::date, coalesce(history.first_pending, (now() AT TIME ZONE 'UTC')::date + 1), coalesce(history.last_date + 1, r.fecha_inicio::date)),
    r.frecuencia::text, r.dia_mes::integer, r.dia_semana::integer)
FROM (
  SELECT r.id,
    max(i.fecha_programada::date) FILTER (WHERE i.estado IN ('generado', 'omitido')) AS last_date,
    min(i.fecha_programada::date) FILTER (WHERE i.estado='pendiente') AS first_pending
  FROM public.gasto_recurrente r LEFT JOIN public.gasto_recurrente_instancia i ON i.gasto_recurrente_id=r.id
  GROUP BY r.id
) history WHERE r.id=history.id AND r.proxima_fecha IS NULL AND r.ultima_fecha_generada IS NULL;
UPDATE public.gasto_recurrente SET proxima_fecha=NULL WHERE fecha_fin IS NOT NULL AND proxima_fecha > fecha_fin::date;

CREATE OR REPLACE FUNCTION public.recurring_schedule_rule()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE base date;
BEGIN
  PERFORM public.recurring_next_date(NEW.fecha_inicio::date, NEW.frecuencia::text, NEW.dia_mes::integer, NEW.dia_semana::integer);
  IF NEW.fecha_fin IS NOT NULL AND NEW.fecha_fin::date < NEW.fecha_inicio::date THEN
    RAISE EXCEPTION 'fecha_fin debe ser posterior o igual a fecha_inicio' USING ERRCODE = '22023';
  END IF;
  IF NEW.monto IS NULL OR NEW.monto <= 0 OR NEW.monto::text IN ('NaN','Infinity','-Infinity') THEN
    RAISE EXCEPTION 'monto debe ser positivo y finito' USING ERRCODE = '22023';
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.ultima_fecha_generada := NULL;
    NEW.proxima_fecha := public.recurring_next_date(NEW.fecha_inicio::date, NEW.frecuencia::text, NEW.dia_mes::integer, NEW.dia_semana::integer);
  ELSIF NEW.frecuencia IS DISTINCT FROM OLD.frecuencia OR NEW.dia_mes IS DISTINCT FROM OLD.dia_mes
    OR NEW.dia_semana IS DISTINCT FROM OLD.dia_semana OR NEW.fecha_inicio IS DISTINCT FROM OLD.fecha_inicio
    OR NEW.fecha_fin IS DISTINCT FROM OLD.fecha_fin OR (NEW.activo AND NOT OLD.activo) THEN
    -- Edits/resume affect today forward; paused or already consumed dates are not replayed.
    base := greatest(NEW.fecha_inicio::date, (now() AT TIME ZONE 'UTC')::date, NEW.ultima_fecha_generada + 1);
    NEW.proxima_fecha := public.recurring_next_date(base, NEW.frecuencia::text, NEW.dia_mes::integer, NEW.dia_semana::integer);
  END IF;
  IF NEW.fecha_fin IS NOT NULL AND NEW.proxima_fecha > NEW.fecha_fin::date THEN NEW.proxima_fecha := NULL; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS recurring_schedule_rule ON public.gasto_recurrente;
CREATE TRIGGER recurring_schedule_rule BEFORE INSERT OR UPDATE ON public.gasto_recurrente
  FOR EACH ROW EXECUTE FUNCTION public.recurring_schedule_rule();
CREATE INDEX IF NOT EXISTS recurring_due_index ON public.gasto_recurrente(proxima_fecha, id) WHERE activo AND proxima_fecha IS NOT NULL;

CREATE OR REPLACE FUNCTION public.process_recurring_expenses(
  p_today date DEFAULT (now() AT TIME ZONE 'UTC')::date, p_limit integer DEFAULT 200)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE r public.gasto_recurrente%ROWTYPE; next_date date; created integer := 0; processed integer := 0; inserted integer;
BEGIN
  IF p_today IS NULL OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 500 THEN
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
      next_date := public.recurring_next_date(r.proxima_fecha + 1, r.frecuencia::text, r.dia_mes::integer, r.dia_semana::integer);
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
NOTIFY pgrst, 'reload schema';
COMMIT;
