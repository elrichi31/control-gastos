import { useMemo } from 'react'
import { useExpensesStore } from '@/hooks/useExpensesStore'
import { useExpenseCatalogs, useDeleteExpense } from '@/hooks/useExpenseQueries'
import type { ExpenseDetailsCatalogs } from '@/services/expense-details'
import type { Expense } from '@/types'

export interface ExpenseDetailsData extends ExpenseDetailsCatalogs { gastos: Expense[] }

export function useExpenseDetailsData() {
  const store = useExpensesStore()
  const catalogs = useExpenseCatalogs()
  const remove = useDeleteExpense()
  const data = useMemo<ExpenseDetailsData | null>(() => catalogs.data && !store.loading
    ? { gastos: store.gastos, ...catalogs.data } : null, [catalogs.data, store.loading, store.gastos])
  return {
    data,
    loading: catalogs.isPending || store.loading,
    error: catalogs.error?.message ?? store.error,
    refreshData: async () => { await Promise.all([catalogs.refetch(), store.refresh()]) },
    deleteGasto: (id: number) => remove.mutateAsync(id),
  }
}
