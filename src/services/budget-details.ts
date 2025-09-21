// Servicio para operaciones específicas del detalle de presupuesto
import { 
  PresupuestoCategoriaDetalle, 
  CategoriaDB, 
  MetodoPagoDB, 
  MovimientoPresupuesto,
  PresupuestoInfo 
} from "@/lib/budgetDetailsConstants"
import { 
  fetchPresupuestoCategorias as fetchPresupuestoCategoriasBase,
  fetchCategoriasDB as fetchCategoriasDBBase,
  fetchMetodosPago as fetchMetodosPagoBase,
  addCategory as addCategoryBase,
  deleteBudgetCategory as deleteBudgetCategoryBase,
  addBudgetExpense as addBudgetExpenseBase,
  updateBudgetExpense as updateBudgetExpenseBase,
  deleteBudgetExpense as deleteBudgetExpenseBase,
  updatePresupuestoTotal as updatePresupuestoTotalBase,
  fetchPresupuestoMensual as fetchPresupuestoMensualBase,
  copyFromPreviousMonth as copyFromPreviousMonthBase
} from "@/services/budget"

// Re-exportar funciones del servicio budget base con tipos específicos
export const fetchPresupuestoCategorias = async (id: string): Promise<PresupuestoCategoriaDetalle[]> => {
  return await fetchPresupuestoCategoriasBase(id)
}

export const fetchCategoriasDB = async (): Promise<CategoriaDB[]> => {
  return await fetchCategoriasDBBase()
}

export const fetchMetodosPago = async (): Promise<MetodoPagoDB[]> => {
  return await fetchMetodosPagoBase()
}

export const fetchPresupuestoMensual = async (id: string): Promise<PresupuestoInfo | null> => {
  return await fetchPresupuestoMensualBase(id)
}

export const addCategory = async (presupuestoId: string, categoryId: number): Promise<PresupuestoCategoriaDetalle> => {
  return await addCategoryBase(presupuestoId, categoryId)
}

export const deleteBudgetCategory = async (categoryId: number): Promise<boolean> => {
  return await deleteBudgetCategoryBase(categoryId)
}

export const copyFromPreviousMonth = async (presupuestoId: string): Promise<boolean> => {
  return await copyFromPreviousMonthBase(presupuestoId)
}

// Funciones de gastos
export interface AddBudgetExpenseData {
  presupuesto_categoria_id: number
  descripcion: string
  monto: number
  fecha: string
  metodo_pago_id: number
}

export interface UpdateBudgetExpenseData {
  id: number
  descripcion: string
  monto: number
  fecha: string
  metodo_pago_id: number
}

export const addBudgetExpense = async (data: AddBudgetExpenseData): Promise<MovimientoPresupuesto> => {
  return await addBudgetExpenseBase(data)
}

export const updateBudgetExpense = async (data: UpdateBudgetExpenseData): Promise<MovimientoPresupuesto> => {
  return await updateBudgetExpenseBase(data)
}

export const deleteBudgetExpense = async (expenseId: number): Promise<boolean> => {
  return await deleteBudgetExpenseBase(expenseId)
}

export const updatePresupuestoTotal = async (presupuestoId: string, total: number, gastosRegistrados: number): Promise<void> => {
  return await updatePresupuestoTotalBase(presupuestoId, total, gastosRegistrados)
}

// Funciones auxiliares para cálculos
export const calculateBudgetByCategory = (presupuestoCategorias: PresupuestoCategoriaDetalle[], categoriaId: number): number => {
  const cat = presupuestoCategorias.find((c: PresupuestoCategoriaDetalle) => c.categoria_id === categoriaId)
  if (!cat || !Array.isArray(cat.movimientos)) return 0
  return cat.movimientos.reduce((sum, mov) => sum + (typeof mov.monto === "string" ? parseFloat(mov.monto) : mov.monto || 0), 0)
}

export const calculateBudgetTotal = (presupuestoCategorias: PresupuestoCategoriaDetalle[]): number => {
  if (!Array.isArray(presupuestoCategorias)) return 0
  return presupuestoCategorias.reduce((sum, cat) => {
    if (!Array.isArray(cat.movimientos)) return sum
    const movimientosTotal = cat.movimientos.reduce((movSum, mov) => movSum + (typeof mov.monto === "string" ? parseFloat(mov.monto) : mov.monto || 0), 0)
    return sum + movimientosTotal
  }, 0)
}

export const getAvailableCategories = (categoriasDB: CategoriaDB[], presupuestoCategorias: PresupuestoCategoriaDetalle[]): CategoriaDB[] => {
  if (!Array.isArray(presupuestoCategorias)) return []
  return categoriasDB.filter((category) => !presupuestoCategorias.some(c => c.categoria_id === category.id))
}

export const calculateTotalGastosRegistrados = (presupuestoCategorias: PresupuestoCategoriaDetalle[]): number => {
  if (!Array.isArray(presupuestoCategorias)) return 0
  return presupuestoCategorias.reduce((count, cat) => {
    if (!Array.isArray(cat.movimientos)) return count
    return count + cat.movimientos.length
  }, 0)
}