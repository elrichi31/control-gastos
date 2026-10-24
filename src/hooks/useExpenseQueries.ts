"use client"

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { fetchExpenseDetailsData } from '@/services/expense-details'
import { deleteExpense } from '@/services/expenses'
import { invalidateExpenseData, queryKeys } from '@/lib/query/client'

export function useExpenseCatalogs(enabled = true) {
  const { status } = useSession()
  return useQuery({ queryKey: queryKeys.catalogs, queryFn: fetchExpenseDetailsData,
    enabled: enabled && status === 'authenticated', staleTime: 5 * 60_000 })
}

export function useDeleteExpense() {
  const client = useQueryClient()
  return useMutation({ mutationFn: deleteExpense, onSuccess: () => invalidateExpenseData(client) })
}
