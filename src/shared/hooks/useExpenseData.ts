import { useState, useEffect, useMemo } from "react"
import { Expense, ExpenseFilters } from "../../entities/expense"
import { expenseRepository } from "../../services/expense.repository"

export interface UseExpenseDataOptions {
  filters?: ExpenseFilters
  autoFetch?: boolean
}

export interface UseExpenseDataReturn {
  expenses: Expense[]
  loading: boolean
  error: string | null
  totalAmount: number
  filteredExpenses: Expense[]
  refetch: () => Promise<void>
  createExpense: (data: any) => Promise<void>
  updateExpense: (data: any) => Promise<void>
  deleteExpense: (id: string | number) => Promise<void>
}

export function useExpenseData(options: UseExpenseDataOptions = {}): UseExpenseDataReturn {
  const { filters, autoFetch = true } = options
  
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Función para cargar gastos
  const fetchExpenses = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await expenseRepository.list(filters)
      setExpenses(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  // Crear gasto
  const createExpense = async (data: any) => {
    try {
      setLoading(true)
      await expenseRepository.create(data)
      await fetchExpenses() // Recargar lista
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear gasto")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Actualizar gasto
  const updateExpense = async (data: any) => {
    try {
      setLoading(true)
      await expenseRepository.update(data)
      await fetchExpenses() // Recargar lista
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar gasto")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Eliminar gasto
  const deleteExpense = async (id: string | number) => {
    try {
      setLoading(true)
      await expenseRepository.delete(id)
      await fetchExpenses() // Recargar lista
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar gasto")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Cargar gastos automáticamente
  useEffect(() => {
    if (autoFetch) {
      fetchExpenses()
    }
  }, [JSON.stringify(filters), autoFetch])

  // Gastos filtrados (aplicar filtros adicionales en el cliente si es necesario)
  const filteredExpenses = useMemo(() => {
    return expenses // Por ahora retornamos todos, pero aquí se pueden aplicar filtros adicionales
  }, [expenses])

  // Total de gastos
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((total, expense) => total + expense.monto, 0)
  }, [filteredExpenses])

  return {
    expenses,
    loading,
    error,
    totalAmount,
    filteredExpenses,
    refetch: fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  }
}
