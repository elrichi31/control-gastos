-- gasto_recurrente.user_id is text but gasto.user_id is uuid: the cron INSERT failed with
-- 42804 and, being one transaction, no recurring expense was generated. Same body as
-- 20261005 except the explicit cast.
BEGIN;

CREATE OR REPLACE FUNCTION public.process_recurring_expenses(p_today date DEFAULT NULL, p_limit integer DEFAULT 200)
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
        VALUES(r.user_id::uuid, r.descripcion, r.monto, r.categoria_id, r.metodo_pago_id, r.proxima_fecha, true, r.id)
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

NOTIFY pgrst, 'reload schema';
COMMIT;
