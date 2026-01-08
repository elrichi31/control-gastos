"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

export function MobileRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === "undefined") return

    // Detectar si es móvil
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches

    // Solo redirigir si es móvil o PWA instalada
    if (!isMobile && !isStandalone) return

    // Solo redirigir desde la página principal
    if (pathname !== "/") return

    // Esperar a que se cargue la sesión
    if (status === "loading") return

    // Redirigir según el estado de autenticación
    if (status === "authenticated") {
      router.replace("/form")
    } else {
      router.replace("/auth/login")
    }
  }, [router, pathname, session, status])

  return null
}
