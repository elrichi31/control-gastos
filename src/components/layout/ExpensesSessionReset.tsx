"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { resetExpensesStore } from "@/hooks/useExpensesStore"

/** Vacía la caché de gastos al cerrar sesión o al cambiar de usuario. No renderiza nada. */
export function ExpensesSessionReset() {
  const { data, status } = useSession()
  const userKey = data?.user?.id ?? data?.user?.email ?? null
  const lastUser = useRef<string | null>(null)
  useEffect(() => {
    if (status === "unauthenticated") {
      resetExpensesStore()
      lastUser.current = null
    } else if (status === "authenticated") {
      // El primer usuario conocido no vacía nada: solo un cambio de usuario.
      if (lastUser.current && lastUser.current !== userKey) resetExpensesStore()
      lastUser.current = userKey
    }
  }, [status, userKey])
  return null
}
