-- Alias personales para transferencias importadas; el correo original permanece intacto.
BEGIN;

CREATE TABLE IF NOT EXISTS public.correo_alias (
  user_id text NOT NULL,
  destinatario text NOT NULL CHECK (length(btrim(destinatario)) > 0),
  alias text NOT NULL CHECK (length(btrim(alias)) BETWEEN 1 AND 200),
  PRIMARY KEY (user_id, destinatario)
);

-- El servidor filtra siempre por el usuario autenticado. Sin acceso directo público.
ALTER TABLE public.correo_alias ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.correo_alias FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.correo_alias TO service_role;
DROP POLICY IF EXISTS correo_alias_service ON public.correo_alias;
CREATE POLICY correo_alias_service ON public.correo_alias FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
COMMIT;
