BEGIN;

-- The anon key is public (NEXT_PUBLIC_SUPABASE_ANON_KEY ships to the browser) and these
-- tables had RLS off with full anon grants: anyone could read or change every user's data
-- straight through PostgREST. The app now reaches them only through the server's service
-- role (src/lib/auth/auth-supabase.ts), which filters every query by the authenticated user.
--
-- Apply AFTER deploying that code: before it, the app itself still uses the anon key.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['categoria', 'gasto', 'gasto_recurrente', 'gasto_recurrente_instancia',
    'metodo_pago', 'movimiento_presupuesto', 'presupuesto_categoria', 'presupuesto_mensual']
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      -- Privileges are checked before policies, so leftover permissive policies cannot reopen access.
      EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', t);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role', t);
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;
