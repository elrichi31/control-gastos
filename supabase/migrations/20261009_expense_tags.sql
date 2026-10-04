-- Apply before deploying the tags UI/API. Existing expenses remain untagged.
BEGIN;

-- Pure validation only: no data access and no SECURITY DEFINER privileges.
CREATE OR REPLACE FUNCTION public.valid_expense_tags(value text[])
RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE
SET search_path = pg_catalog
AS $$
  SELECT value IS NOT NULL
    AND cardinality(value) <= 10
    AND (cardinality(value) = 0 OR array_ndims(value) = 1)
    AND NOT EXISTS (
      SELECT 1 FROM unnest(value) AS tag
      WHERE tag IS NULL OR char_length(tag) NOT BETWEEN 1 AND 30
        OR tag ~ '[,[:cntrl:]]' OR tag <> btrim(tag)
    );
$$;

ALTER TABLE public.gasto ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.movimiento_presupuesto ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gasto_tags_valid' AND conrelid = 'public.gasto'::regclass) THEN
    ALTER TABLE public.gasto ADD CONSTRAINT gasto_tags_valid CHECK (public.valid_expense_tags(tags));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'movimiento_presupuesto_tags_valid' AND conrelid = 'public.movimiento_presupuesto'::regclass) THEN
    ALTER TABLE public.movimiento_presupuesto ADD CONSTRAINT movimiento_presupuesto_tags_valid CHECK (public.valid_expense_tags(tags));
  END IF;
END;
$$;

COMMIT;
