// src/hooks/useExpenseDetailsData.ts
import { useState, useEffect, useCallback } from 'react'
import { fetchExpenseDetailsData, deleteExpense, type ExpenseDetailsData } from '@/services/expense-details'
import type { Expense } from '@/services/expenses'

interface UseExpenseDetailsDataResult {
  data: ExpenseDetailsData | null
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
  deleteGasto: (id: number) => Promise<void>
}

export function useExpenseDetailsData(): UseExpenseDetailsDataResult {
  const [data, setData] = useState<ExpenseDetailsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchExpenseDetailsData()
      setData(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      console.error('Error loading expense details data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshData = useCallback(async () => {
    await loadData()
  }, [loadData])

  const deleteGasto = useCallback(async (id: number) => {
    try {
      await deleteExpense(id)
      
      // Actualizar la lista local eliminando el gasto
      if (data) {
        const updatedGastos = data.gastos.filter(gasto => gasto.id !== id)
        setData({
          ...data,
          gastos: updatedGastos
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar el gasto'
      console.error('Error deleting expense:', err)
      throw new Error(message)
    }
  }, [data])

  // Cargar datos inicialmente
  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    data,
    loading,
    error,
    refreshData,
    deleteGasto
  }
}