BEGIN;

-- Defense in depth after 20261007: the public anon key must not execute anything that
-- touches data. None of these is SECURITY DEFINER (they run as the caller, and anon has no
-- table access left), but revoking keeps them harmless if that ever changes.
-- Legacy generator functions are unused since 20261003; revoked, not dropped, so it is reversible.
DO $$
DECLARE f regprocedure;
BEGIN
  FOR f IN SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN (
      'crear_y_procesar_gasto_recurrente_automatico', 'generar_instancias_gasto_especifico',
      'generar_instancias_gastos_recurrentes', 'generar_instancias_gastos_recurrentes_mejorada',
      'procesar_gastos_recurrentes_pendientes', 'recurring_schedule_rule', 'update_updated_at_column')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;
