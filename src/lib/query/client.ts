import { QueryClient } from '@tanstack/react-query'

// One instance per mounted session, never a server-side module singleton.
export function createQueryClient() {
  return new QueryClient({ defaultOptions: {
    queries: { staleTime: 30_000, gcTime: typeof window === 'undefined' ? Infinity : 5 * 60_000, retry: 1 },
    mutations: { retry: false },
  } })
}

export const queryKeys = {
  expenses: ['expenses'] as const,
  catalogs: ['expense-catalogs'] as const,
  monthPlan: ['month-plan'] as const,
  forecast: ['expense-forecast'] as const,
  budgets: ['budgets'] as const,
}

export async function invalidateExpenseData(client: QueryClient) {
  await Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.expenses }),
    client.invalidateQueries({ queryKey: queryKeys.monthPlan }),
    client.invalidateQueries({ queryKey: queryKeys.forecast }),
    client.invalidateQueries({ queryKey: queryKeys.budgets }),
  ])
}
