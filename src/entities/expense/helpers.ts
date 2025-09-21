import { Expense, GroupedExpenses, GroupByPeriod } from "./types"

// Helper para formatear monto
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount)
}

// Helper para calcular total de gastos
export const calculateExpensesTotal = (expenses: Expense[]): number => {
  return expenses.reduce((total, expense) => total + expense.monto, 0)
}

// Helper para ordenar gastos por fecha (más reciente primero)
export const sortExpensesByDate = (expenses: Expense[]): Expense[] => {
  return [...expenses].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
}
