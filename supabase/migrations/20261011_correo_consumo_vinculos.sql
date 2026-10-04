-- Duplicados y gastos compartidos en la revisión de consumos del correo.
--   tipo 'ingreso': dinero recibido (p. ej. la parte de otra persona en un gasto compartido).
--   estado 'vinculado' + gasto_id: el correo corresponde a un gasto que ya existía (duplicado),
--   o el ingreso se descontó de ese gasto.
BEGIN;

ALTER TABLE public.correo_consumo ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'gasto';
ALTER TABLE public.correo_consumo ADD COLUMN IF NOT EXISTS gasto_id bigint;

ALTER TABLE public.correo_consumo DROP CONSTRAINT IF EXISTS correo_consumo_tipo_check;
ALTER TABLE public.correo_consumo ADD CONSTRAINT correo_consumo_tipo_check CHECK (tipo IN ('gasto', 'ingreso'));
ALTER TABLE public.correo_consumo DROP CONSTRAINT IF EXISTS correo_consumo_estado_check;
ALTER TABLE public.correo_consumo ADD CONSTRAINT correo_consumo_estado_check
  CHECK (estado IN ('pendiente', 'aceptado', 'descartado', 'vinculado'));

NOTIFY pgrst, 'reload schema';
COMMIT;
