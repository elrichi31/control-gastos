-- Última ejecución de cada cron (una fila por job, se pisa en cada corrida) para mostrarla en la app.
BEGIN;

CREATE TABLE IF NOT EXISTS public.cron_run (
  job text PRIMARY KEY CHECK (job IN ('sync-email', 'recurring-expenses')),
  ran_at timestamptz NOT NULL DEFAULT now(),
  ok boolean NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.cron_run ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cron_run FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.cron_run TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
