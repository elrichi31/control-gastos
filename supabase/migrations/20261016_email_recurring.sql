BEGIN;

-- Evidencia por ocurrencia, separada de la fecha e importe programados.
ALTER TABLE public.correo_consumo ADD COLUMN IF NOT EXISTS recurrente_id bigint REFERENCES public.gasto_recurrente(id) ON DELETE SET NULL;
ALTER TABLE public.correo_consumo ADD COLUMN IF NOT EXISTS fecha_programada date;
ALTER TABLE public.correo_consumo ADD COLUMN IF NOT EXISTS monto_esperado numeric(12,2);
CREATE UNIQUE INDEX IF NOT EXISTS correo_recurring_confirmed_unique
  ON public.correo_consumo(recurrente_id, fecha_programada) WHERE estado = 'vinculado' AND recurrente_id IS NOT NULL;

-- Solo el servidor autenticado llama esta RPC, nunca el cliente directo.
-- Orden de locks: regla (igual que el cron), correo, gasto. Todo o nada.
CREATE OR REPLACE FUNCTION public.confirm_email_recurring(
  p_user_id text, p_correo_id bigint, p_recurrente_id bigint, p_fecha date,
  p_update_price boolean, p_expected_amount numeric, p_expected_tax jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE r public.gasto_recurrente%ROWTYPE; c public.correo_consumo%ROWTYPE;
  g public.gasto%ROWTYPE; total numeric; tax jsonb; rate numeric; expected_base numeric;
BEGIN
  SELECT * INTO r FROM public.gasto_recurrente WHERE id=p_recurrente_id AND user_id::text=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Recurrente no encontrado' USING ERRCODE='22023'; END IF;
  SELECT * INTO c FROM public.correo_consumo WHERE id=p_correo_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND OR c.tipo <> 'gasto' THEN RAISE EXCEPTION 'Correo no encontrado' USING ERRCODE='22023'; END IF;
  IF c.estado <> 'pendiente' THEN RETURN jsonb_build_object('vinculados',0); END IF;
  IF r.monto IS DISTINCT FROM p_expected_amount OR r.impuesto_exterior IS DISTINCT FROM p_expected_tax THEN
    RAISE EXCEPTION 'El precio cambió; revisa de nuevo' USING ERRCODE='40001';
  END IF;
  IF p_update_price IS NULL OR p_fecha IS NULL OR abs(p_fecha-c.fecha) > 3 OR p_fecha < r.fecha_inicio::date
    OR (r.fecha_fin IS NOT NULL AND p_fecha > r.fecha_fin::date)
    OR public.recurring_next_date(p_fecha,r.frecuencia::text,r.dia_mes::integer,r.dia_semana::integer,r.mes_anual::integer) <> p_fecha THEN
    RAISE EXCEPTION 'Fecha recurrente inválida' USING ERRCODE='22023';
  END IF;
  SELECT * INTO g FROM public.gasto WHERE gasto_recurrente_id=r.id AND fecha=p_fecha FOR UPDATE;
  IF FOUND AND g.user_id::text <> p_user_id THEN RAISE EXCEPTION 'Gasto ajeno' USING ERRCODE='22023'; END IF;
  IF EXISTS(SELECT 1 FROM public.correo_consumo WHERE tipo='gasto' AND estado='vinculado' AND
    ((recurrente_id=r.id AND fecha_programada=p_fecha) OR (gasto_id=g.id AND g.id IS NOT NULL))) THEN
    RAISE EXCEPTION 'Este cobro ya fue confirmado' USING ERRCODE='23505';
  END IF;
  IF g.id IS NULL AND (NOT r.activo OR r.proxima_fecha IS NULL OR p_fecha < r.proxima_fecha
    OR (r.ultima_fecha_generada IS NOT NULL AND p_fecha <= r.ultima_fecha_generada)) THEN
    RAISE EXCEPTION 'Este cobro fue omitido o eliminado' USING ERRCODE='22023';
  END IF;
  -- El monto bancario es el precio base, igual que en la aceptación del correo.
  -- Se mantienen las tasas ya elegidas; no se confunde el total con un aumento.
  expected_base := coalesce((r.impuesto_exterior->>'base')::numeric,r.monto);
  total := c.monto;
  tax := r.impuesto_exterior;
  IF tax IS NOT NULL THEN
    IF tax->'selected' ? 'isd' THEN total := total + round(c.monto*0.05,2); END IF;
    IF tax->'selected' ? 'iva_digital' THEN total := total + round(c.monto*0.15,2); END IF;
    IF tax->'selected' ? 'custom' THEN
      rate := replace(tax->>'customRate',',','.')::numeric;
      IF rate IS NULL OR rate <= 0 OR rate > 100 THEN RAISE EXCEPTION 'Impuesto inválido' USING ERRCODE='22023'; END IF;
      total := total + round(c.monto*rate/100,2);
    END IF;
    tax := jsonb_set(tax,'{base}',to_jsonb(c.monto));
  END IF;
  IF g.id IS NULL THEN
    INSERT INTO public.gasto(user_id,descripcion,monto,categoria_id,metodo_pago_id,fecha,is_recurrent,gasto_recurrente_id,impuesto_exterior,tags)
      VALUES(r.user_id::uuid,r.descripcion,total,r.categoria_id,r.metodo_pago_id,p_fecha,true,r.id,tax,
        CASE WHEN tax IS NULL THEN '{}'::text[] ELSE ARRAY['exterior'] END) RETURNING * INTO g;
    -- El cron conserva su cursor y consumirá esta fecha sin duplicarla por el índice único.
  ELSE
    UPDATE public.gasto SET monto=total, impuesto_exterior=tax WHERE id=g.id;
  END IF;
  IF p_update_price THEN
    UPDATE public.gasto_recurrente SET monto=total, impuesto_exterior=tax WHERE id=r.id;
  END IF;
  UPDATE public.correo_consumo SET estado='vinculado',gasto_id=g.id,recurrente_id=r.id,
    fecha_programada=p_fecha,monto_esperado=expected_base WHERE id=c.id;
  RETURN jsonb_build_object('vinculados',1,'gasto_id',g.id,'monto',total,'precio_actualizado',p_update_price);
END $$;
REVOKE ALL ON FUNCTION public.confirm_email_recurring(text,bigint,bigint,date,boolean,numeric,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_email_recurring(text,bigint,bigint,date,boolean,numeric,jsonb) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
