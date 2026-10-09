-- Compra en el exterior: guarda el precio original y los impuestos elegidos (ISD, IVA digital,
-- otro %) para que al editar un gasto o un recurrente la opción aparezca marcada.
-- `monto` sigue siendo el total con impuestos; reportes y presupuestos no cambian.
-- Formato: {"base": 15.99, "selected": ["isd", "iva_digital"], "customRate": ""}
-- Idempotente y transaccional. El código ya desplegado funciona antes y después de aplicarla.
BEGIN;

ALTER TABLE public.gasto ADD COLUMN IF NOT EXISTS impuesto_exterior jsonb;
ALTER TABLE public.gasto_recurrente ADD COLUMN IF NOT EXISTS impuesto_exterior jsonb;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gasto_impuesto_exterior_object' AND conrelid = 'public.gasto'::regclass) THEN
    ALTER TABLE public.gasto ADD CONSTRAINT gasto_impuesto_exterior_object
      CHECK (impuesto_exterior IS NULL OR jsonb_typeof(impuesto_exterior) = 'object');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gasto_recurrente_impuesto_exterior_object' AND conrelid = 'public.gasto_recurrente'::regclass) THEN
    ALTER TABLE public.gasto_recurrente ADD CONSTRAINT gasto_recurrente_impuesto_exterior_object
      CHECK (impuesto_exterior IS NULL OR jsonb_typeof(impuesto_exterior) = 'object');
  END IF;
END $$;

-- Los gastos que genera el cron heredan el detalle de su regla (y la etiqueta "exterior")
-- sin tocar process_recurring_expenses.
CREATE OR REPLACE FUNCTION public.gasto_inherit_impuesto_exterior()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE rule_tax jsonb;
BEGIN
  IF NEW.gasto_recurrente_id IS NULL OR NEW.impuesto_exterior IS NOT NULL THEN RETURN NEW; END IF;
  SELECT impuesto_exterior INTO rule_tax FROM public.gasto_recurrente WHERE id = NEW.gasto_recurrente_id;
  IF rule_tax IS NULL THEN RETURN NEW; END IF;
  NEW.impuesto_exterior := rule_tax;
  IF NOT ('exterior' = ANY(coalesce(NEW.tags, '{}'))) AND cardinality(coalesce(NEW.tags, '{}')) < 10 THEN
    NEW.tags := coalesce(NEW.tags, '{}') || 'exterior'::text;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.gasto_inherit_impuesto_exterior() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS gasto_inherit_impuesto_exterior ON public.gasto;
CREATE TRIGGER gasto_inherit_impuesto_exterior BEFORE INSERT ON public.gasto
  FOR EACH ROW EXECUTE FUNCTION public.gasto_inherit_impuesto_exterior();

NOTIFY pgrst, 'reload schema';
COMMIT;
