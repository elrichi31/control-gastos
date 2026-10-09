"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

interface PageTitleProps {
  customTitle?: string
}

const getPageTitle = (pathname: string): string => {
  const baseTitles: Record<string, string> = {
    "/": "Dashboard - BethaSpend",
    "/form": "Registrar Gasto - BethaSpend", 
    "/estadisticas": "Estadísticas - BethaSpend",
    "/presupuesto": "Presupuestos - BethaSpend",
    "/datos": "Datos - BethaSpend"
  }

  // Rutas dinámicas
  if (pathname.startsWith("/presupuesto/")) {
    return "Detalle Presupuesto - BethaSpend"
  }

  return baseTitles[pathname] || "BethaSpend"
}

export function PageTitle({ customTitle }: PageTitleProps) {
  const pathname = usePathname()

  useEffect(() => {
    const title = customTitle || getPageTitle(pathname)
    document.title = title
  }, [pathname, customTitle])

  return null
}
