export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  paymentMethod: string
}

export interface CategoryBudget {
  category: string
  budgetAmount: number
  plannedExpenses: Expense[]
}
