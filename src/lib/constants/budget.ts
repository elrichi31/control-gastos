// Constantes y tipos relacionados con presupuestos

export interface MonthData {
  name: string
  value: string
  number: number
}

export const allMonths: MonthData[] = [
  { name: "Enero", value: "enero", number: 1 },
  { name: "Febrero", value: "febrero", number: 2 },
  { name: "Marzo", value: "marzo", number: 3 },
  { name: "Abril", value: "abril", number: 4 },
  { name: "Mayo", value: "mayo", number: 5 },
  { name: "Junio", value: "junio", number: 6 },
  { name: "Julio", value: "julio", number: 7 },
  { name: "Agosto", value: "agosto", number: 8 },
  { name: "Septiembre", value: "septiembre", number: 9 },
  { name: "Octubre", value: "octubre", number: 10 },
  { name: "Noviembre", value: "noviembre", number: 11 },
  { name: "Diciembre", value: "diciembre", number: 12 },
]

// Interfaces para el detalle de presupuesto
export interface MovimientoPresupuesto {
  id: number
  descripcion: string
  monto: number
  fecha: string
  metodo_pago_id: number
  tags?: string[]
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
  tags?: string
}

export interface EditingExpense {
  expense: MovimientoPresupuesto
  categoryId: number
}

export interface ExpenseToDelete {
  id: number
  descripcion: string
}
