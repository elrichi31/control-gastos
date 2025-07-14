export type Expense = {
  id: number
  descripcion: string
  monto: number
  fecha: string
  categoria_id: number
  metodo_pago_id: number
  categoria: { id: number; nombre: string }
  metodo_pago: { id: number; nombre: string }
}

export interface CategoryBudget {
  category: string
  budgetAmount: number
  plannedExpenses: Expense[]
}
