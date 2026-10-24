import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { fetchBudgetsByYear, createBudget, deleteBudget, mapBudgetStatus, mapBudgetTrend, getBudgetStateString, type MonthlyDataGrid } from '@/services/budget-general'
import { allMonths } from '@/lib/constants'
import { queryKeys } from '@/lib/query/client'

export function useBudgetData(selectedYear: string) {
  const { status } = useSession()
  const client = useQueryClient()
  const [errorMsg, setErrorMsg] = useState('')
  const query = useQuery({ queryKey: [...queryKeys.budgets, selectedYear],
    queryFn: () => fetchBudgetsByYear(selectedYear, true), enabled: status === 'authenticated' })
  const grid: MonthlyDataGrid = {}
  const months: string[] = []
  for (const item of query.data ?? []) {
    const month = allMonths[item.mes - 1]
    if (!month || String(item.anio) !== selectedYear) continue
    months.push(month.value)
    grid[month.value] = { total: item.total, expenses: item.gastos_registrados,
      status: mapBudgetStatus(item.estado, item.anio, item.mes), trend: mapBudgetTrend(item.tendencia), previousMonth: 0, id: item.id }
  }
  const invalidate = async () => { await Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.budgets }),
    client.invalidateQueries({ queryKey: queryKeys.monthPlan }),
    client.invalidateQueries({ queryKey: queryKeys.budgetDetails }),
  ]) }
  const create = useMutation({ mutationFn: createBudget, onSuccess: invalidate })
  const remove = useMutation({ mutationFn: (month: number) => deleteBudget(selectedYear, month), onSuccess: invalidate })
  const addMonth = async (value: string) => {
    setErrorMsg('')
    const month = allMonths.find(m => m.value === value)
    if (!month) return false
    try {
      await create.mutateAsync({ anio: Number(selectedYear), mes: month.number, total: 0,
        gastos_registrados: 0, tendencia: null, estado: getBudgetStateString(Number(selectedYear), month.number) })
      return true
    } catch { setErrorMsg('Error al crear el presupuesto'); return false }
  }
  const removeMonth = async (value: string) => {
    setErrorMsg('')
    if (grid[value]?.expenses > 0) return false
    const month = allMonths.find(m => m.value === value)
    if (!month) return false
    try { await remove.mutateAsync(month.number); return true }
    catch { setErrorMsg('Error al eliminar el presupuesto'); return false }
  }
  return { monthsByYear: { [selectedYear]: months }, dataByYear: { [selectedYear]: grid },
    isLoading: query.isPending, errorMsg: errorMsg || query.error?.message || '', setErrorMsg,
    addMonth, removeMonth }
}
