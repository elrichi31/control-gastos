import { useState, useMemo } from "react"
import { useExpenseData } from "@shared/hooks"
import { Expense, GroupByPeriod, sortExpensesByDate } from "@entities/expense"
import { groupExpenses } from "../../../shared/lib/groupExpenses"
import { toDateWithTime } from "../../../shared/lib/dateUtils"

export interface UseFilteredExpensesOptions {
  autoFetch?: boolean
}

export interface UseFilteredExpensesReturn {
  expenses: Expense[]
  filteredExpenses: Expense[]
  groupedExpenses: Record<string, Expense[]>
  loading: boolean
  error: string | null
  dateRange: { from: string; to: string }
  groupBy: GroupByPeriod
  setDateRange: (range: { from: string; to: string }) => void
  setGroupBy: (groupBy: GroupByPeriod) => void
  handleFilterChange: (range: { from: string; to: string }, group: GroupByPeriod) => void
  createExpense: (data: any) => Promise<void>
  deleteExpense: (id: string | number) => Promise<void>
  refetch: () => Promise<void>
}

export function useFilteredExpenses(options: UseFilteredExpensesOptions = {}): UseFilteredExpensesReturn {
  const { autoFetch = true } = options
  
  const {
    expenses,
    loading,
    error,
    refetch,
    createExpense,
    deleteExpense
  } = useExpenseData({ autoFetch })

  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" })
  const [groupBy, setGroupBy] = useState<GroupByPeriod>("dia")

  const handleFilterChange = (
    range: { from: string; to: string },
    group: GroupByPeriod
  ) => {
    setDateRange(range)
    setGroupBy(group)
  }

  // Filtrar gastos por rango de fechas
  const filteredExpenses = useMemo(() => {
    if (!expenses) return []

    return expenses.filter((expense) => {
      if (!dateRange.from && !dateRange.to) return true

      const expenseDate = toDateWithTime(expense.fecha)
      const fromDate = dateRange.from ? toDateWithTime(dateRange.from) : null
      const toDate = dateRange.to ? toDateWithTime(dateRange.to, 'end') : null

      if (fromDate && toDate) return expenseDate >= fromDate && expenseDate <= toDate
      if (fromDate) return expenseDate >= fromDate
      if (toDate) return expenseDate <= toDate
      return true
    })
  }, [expenses, dateRange])

  // Agrupar gastos filtrados
  const groupedExpenses = useMemo(() => {
    if (!filteredExpenses.length) return {}
    return groupExpenses(filteredExpenses, groupBy)
  }, [filteredExpenses, groupBy])

  return {
    expenses,
    filteredExpenses,
    groupedExpenses,
    loading,
    error,
    dateRange,
    groupBy,
    setDateRange,
    setGroupBy,
    handleFilterChange,
    createExpense,
    deleteExpense,
    refetch
  }
}
