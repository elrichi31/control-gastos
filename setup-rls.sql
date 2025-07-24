-- Script para implementar Row Level Security (RLS) en las tablas de la aplicación

-- 1. Agregar columna user_id a las tablas principales si no existe
ALTER TABLE gasto ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE presupuesto_mensual ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE presupuesto_categoria ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE movimiento_presupuesto ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Actualizar registros existentes para asignarlos al usuario actual (temporal)
-- NOTA: Ejecutar esto SOLO si tienes datos existentes y quieres asignarlos a un usuario específico
-- UPDATE gasto SET user_id = 'TU_USER_ID_AQUI' WHERE user_id IS NULL;
-- UPDATE presupuesto_mensual SET user_id = 'TU_USER_ID_AQUI' WHERE user_id IS NULL;
-- UPDATE presupuesto_categoria SET user_id = 'TU_USER_ID_AQUI' WHERE user_id IS NULL;
-- UPDATE movimiento_presupuesto SET user_id = 'TU_USER_ID_AQUI' WHERE user_id IS NULL;

-- 3. Hacer user_id NOT NULL después de actualizar los datos existentes
-- ALTER TABLE gasto ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE presupuesto_mensual ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE presupuesto_categoria ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE movimiento_presupuesto ALTER COLUMN user_id SET NOT NULL;

-- 4. Habilitar Row Level Security en todas las tablas
ALTER TABLE gasto ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuesto_mensual ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuesto_categoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimiento_presupuesto ENABLE ROW LEVEL SECURITY;

-- Las tablas de referencia no necesitan RLS ya que son compartidas
-- (categoria, metodo_pago)

-- 5. Crear políticas RLS para la tabla gasto
CREATE POLICY "Users can view own gastos" ON gasto
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gastos" ON gasto
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gastos" ON gasto
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gastos" ON gasto
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Crear políticas RLS para la tabla presupuesto_mensual
CREATE POLICY "Users can view own presupuesto_mensual" ON presupuesto_mensual
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presupuesto_mensual" ON presupuesto_mensual
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presupuesto_mensual" ON presupuesto_mensual
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presupuesto_mensual" ON presupuesto_mensual
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Crear políticas RLS para la tabla presupuesto_categoria
CREATE POLICY "Users can view own presupuesto_categoria" ON presupuesto_categoria
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presupuesto_categoria" ON presupuesto_categoria
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presupuesto_categoria" ON presupuesto_categoria
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presupuesto_categoria" ON presupuesto_categoria
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Crear políticas RLS para la tabla movimiento_presupuesto
CREATE POLICY "Users can view own movimiento_presupuesto" ON movimiento_presupuesto
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own movimiento_presupuesto" ON movimiento_presupuesto
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own movimiento_presupuesto" ON movimiento_presupuesto
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own movimiento_presupuesto" ON movimiento_presupuesto
    FOR DELETE USING (auth.uid() = user_id);

-- 9. Políticas para tablas de referencia (lectura pública)
ALTER TABLE categoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE metodo_pago ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categorias" ON categoria
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view metodos_pago" ON metodo_pago
    FOR SELECT USING (true);

-- 10. Crear función para obtener el user_id del usuario autenticado
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS UUID AS $$
    SELECT auth.uid();
$$ LANGUAGE SQL STABLE;

-- 11. Crear triggers para auto-asignar user_id en inserts
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a las tablas principales
CREATE TRIGGER set_user_id_gasto
    BEFORE INSERT ON gasto
    FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_user_id_presupuesto_mensual
    BEFORE INSERT ON presupuesto_mensual
    FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_user_id_presupuesto_categoria
    BEFORE INSERT ON presupuesto_categoria
    FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_user_id_movimiento_presupuesto
    BEFORE INSERT ON movimiento_presupuesto
    FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- 12. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_gasto_user_id ON gasto(user_id);
CREATE INDEX IF NOT EXISTS idx_presupuesto_mensual_user_id ON presupuesto_mensual(user_id);
CREATE INDEX IF NOT EXISTS idx_presupuesto_categoria_user_id ON presupuesto_categoria(user_id);
CREATE INDEX IF NOT EXISTS idx_movimiento_presupuesto_user_id ON movimiento_presupuesto(user_id);
