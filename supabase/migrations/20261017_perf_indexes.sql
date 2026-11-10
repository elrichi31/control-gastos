-- Índices para las lecturas más frecuentes de la app. IF NOT EXISTS: si ya hay uno equivalente
-- con otro nombre en el esquema base, revisa con \di y borra el duplicado.

-- Listado de gastos, dashboard, proyección y revisión del correo: siempre por usuario y rango de fechas.
CREATE INDEX IF NOT EXISTS gasto_user_fecha ON public.gasto(user_id, fecha DESC);

-- Detalle del presupuesto: categorías del mes y movimientos de esas categorías.
CREATE INDEX IF NOT EXISTS presupuesto_categoria_mensual ON public.presupuesto_categoria(presupuesto_mensual_id, user_id);
CREATE INDEX IF NOT EXISTS movimiento_presupuesto_categoria ON public.movimiento_presupuesto(presupuesto_categoria_id, user_id);

-- Revisión del correo: gastos ya vinculados a un correo.
CREATE INDEX IF NOT EXISTS correo_consumo_vinculados ON public.correo_consumo(user_id) WHERE tipo = 'gasto' AND gasto_id IS NOT NULL;
