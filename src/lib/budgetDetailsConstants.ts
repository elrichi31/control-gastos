// Interfaces compartidas para el detalle de presupuesto

export interface MovimientoPresupuesto {
  id: number
  descripcion: string
  monto: number
  fecha: string
  metodo_pago_id: number
}

export interface PresupuestoCategoriaDetalle {
  id: number
  categoria_id: number
  total_categoria: number
  cantidad_gastos: number
  categoria: { nombre: string }
  movimientos: MovimientoPresupuesto[]
}

export interface CategoriaDB {
  id: number;
  nombre: string;
  icono?: string;
  color?: string;
}

export interface MetodoPagoDB {
  id: number;
  nombre: string;
}

export interface PresupuestoInfo {
  mes: number
  anio: number
}

export interface ExpenseFormData {
  name: string
  amount: string
  paymentDate: string
  category: string
  metodoPago: string
}

export interface EditingExpense {
  expense: MovimientoPresupuesto
  categoryId: number
}

export interface ExpenseToDelete {
  id: number
  descripcion: string
}