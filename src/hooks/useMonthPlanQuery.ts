"use client"

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { fetchBudgetsForMonthPlan } from '@/services/budget-general'
import { fetchBudgetCategoriesForMonthPlan } from '@/services/budget-details'
import { fetchRecurringPlan } from '@/services/recurring-expenses'
import { queryKeys } from '@/lib/query/client'

export function useMonthPlanQuery(monthKey: string) {
  const { status } = useSession()
  return useQuery({
    queryKey: [...queryKeys.monthPlan, monthKey],
    enabled: status === 'authenticated',
    queryFn: async ({ signal }) => {
      const [year, month] = monthKey.split('-').map(Number)
      const [budgets, recurring] = await Promise.all([
        fetchBudgetsForMonthPlan(year, signal), fetchRecurringPlan(monthKey, signal),
      ])
      if (!Array.isArray(budgets) || !Array.isArray(recurring.rules) || !Array.isArray(recurring.links)) throw new Error('La respuesta del plan del mes no es válida.')
      const budget = budgets.find(b => Number(b.mes) === month && Number(b.anio) === year)
      const categories = budget ? await fetchBudgetCategoriesForMonthPlan(budget.id, signal) : []
      if (!Array.isArray(categories) || (budget && !Number.isFinite(Number(budget.total)))) throw new Error('El presupuesto del mes no es válido.')
      return {
        budgetTotal: budget ? Number(budget.total) : undefined,
        budgetCategories: categories,
        rules: recurring.rules,
        recurringLinks: Object.fromEntries(recurring.links.map(link => [link.id, link.gasto_recurrente_id])) as Record<number, number>,
      }
    },
  })
}
