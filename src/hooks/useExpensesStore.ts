"use client"

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { fetchExpenses } from '@/services/expenses'
import { invalidateExpenseData, queryKeys } from '@/lib/query/client'
import type { Gasto } from '@/types'

const EMPTY: Gasto[] = []

/** Compatibility interface for existing consumers; TanStack owns remote state. */
export function useExpensesStore() {
  const { status } = useSession()
  const client = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.expenses,
    queryFn: ({ signal }) => fetchExpenses(signal),
    enabled: status === 'authenticated',
  })
  const refresh = useCallback(() => invalidateExpenseData(client), [client])
  return {
    gastos: query.data ?? EMPTY,
    loading: query.isPending,
    error: query.error?.message ?? null,
    refresh,
  }
}
