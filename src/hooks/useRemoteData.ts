"use client"
import { useSession } from 'next-auth/react'
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'

export function useRemoteQuery<T>(queryKey: QueryKey, queryFn: (signal: AbortSignal) => Promise<T>, options: { enabled?: boolean; staleTime?: number; refetchInterval?: number } = {}) {
  const { status } = useSession()
  return useQuery({ queryKey, queryFn: ({ signal }) => queryFn(signal), ...options, enabled: status === 'authenticated' && options.enabled !== false })
}

/** Financial writes never retry automatically. Inactive views are marked stale. */
export function useRemoteMutation<T, V>(mutationFn: (variables: V) => Promise<T>, keys: readonly QueryKey[]) {
  const client = useQueryClient()
  return useMutation({ mutationFn, retry: false, onSuccess: async () => {
    await Promise.all(keys.map(queryKey => client.invalidateQueries({ queryKey })))
  } })
}

export type CachedRead = <T>(key: QueryKey, load: () => Promise<T>) => Promise<T>
export function useCachedRead(): CachedRead {
  const client = useQueryClient()
  return (queryKey, queryFn) => client.fetchQuery({ queryKey, queryFn })
}
