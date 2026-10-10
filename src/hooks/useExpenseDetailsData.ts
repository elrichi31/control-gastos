// src/hooks/useExpenseDetailsData.ts
import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchExpenseDetailsData, deleteExpense, type ExpenseDetailsCatalogs } from '@/services/expense-details'
import { useExpensesStore } from '@/hooks/useExpensesStore'
import type { Category } from '@/services/categories'
import type { PaymentMethod } from '@/services/paymentMethods'
import type { Expense } from '@/types'

export interface ExpenseDetailsData {
  gastos: Expense[]
  categories: Category[]
  paymentMethods: PaymentMethod[]
}

interface UseExpenseDetailsDataResult {
  data: ExpenseDetailsData | null
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
  deleteGasto: (id: number) => Promise<void>
}

export function useExpenseDetailsData(): UseExpenseDetailsDataResult {
  const store = useExpensesStore()
  const { refresh } = store
  const [catalogs, setCatalogs] = useState<ExpenseDetailsCatalogs | null>(null)
  const [catalogsLoading, setCatalogsLoading] = useState(true)
  const [catalogsError, setCatalogsError] = useState<string | null>(null)

  const loadCatalogs = useCallback(async () => {
    try {
      setCatalogsLoading(true)
      setCatalogsError(null)
      setCatalogs(await fetchExpenseDetailsData())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setCatalogsError(message)
      console.error('Error loading expense details data:', err)
    } finally {
      setCatalogsLoading(false)
    }
  }, [])

  const refreshData = useCallback(async () => {
    await Promise.all([loadCatalogs(), refresh()])
  }, [loadCatalogs, refresh])

  const deleteGasto = useCallback(async (id: number) => {
    try {
      await deleteExpense(id)
      await refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar el gasto'
      console.error('Error deleting expense:', err)
      throw new Error(message)
    }
  }, [refresh])

  // Cargar categorías y métodos de pago inicialmente
  useEffect(() => {
    loadCatalogs()
  }, [loadCatalogs])

  const loading = catalogsLoading || store.loading
  const data = useMemo(
    () => (catalogs && !store.loading ? { gastos: store.gastos, ...catalogs } : null),
    [catalogs, store.loading, store.gastos],
  )

  return {
    data,
    loading,
    error: catalogsError ?? (store.error ? 'Error al cargar los datos de gastos' : null),
    refreshData,
    deleteGasto
  }
}
