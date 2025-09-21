// Tipos base para gastos/expenses
export interface Expense {
  id: number
  descripcion: string
  monto: number
  fecha: string // ISO date string
  categoria_id: number
  metodo_pago_id: number
  categoria: {
    id: number
    nombre: string
  }
  metodo_pago: {
    id: number
    nombre: string
  }
}

// Tipo para crear un nuevo gasto
export interface CreateExpenseInput {
  descripcion: string
  monto: number
  fecha: string
  categoria_id: number
  metodo_pago_id: number
}

// Tipo para actualizar un gasto
export interface UpdateExpenseInput extends Partial<CreateExpenseInput> {
  id: number
}

// Tipo para filtros de gastos
export interface ExpenseFilters {
  from?: string
  to?: string
  categoria_id?: number
  metodo_pago_id?: number
}

// Tipos para agrupación
export type GroupByPeriod = "dia" | "semana" | "mes"

export interface GroupedExpenses {
  [key: string]: Expense[]
}
