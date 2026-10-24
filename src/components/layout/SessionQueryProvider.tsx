"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { disposeSessionEmailReviewQueue } from '@/lib/email-review-queue'
import { createQueryClient } from '@/lib/query/client'

function SessionQueryClient({ children }: { children: React.ReactNode }) {
  const [client] = useState(createQueryClient)
  useEffect(() => () => { disposeSessionEmailReviewQueue(client); client.clear() }, [client])
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

/** A new identity mounts a fresh cache before its children can read any data. */
export function SessionQueryProvider({ children }: { children: React.ReactNode }) {
  const { data, status } = useSession()
  const identity = status === 'authenticated' ? data?.user?.id ?? data?.user?.email : status
  return <SessionQueryClient key={identity}>{children}</SessionQueryClient>
}
