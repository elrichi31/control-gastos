"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

interface PageTitleProps {
  customTitle?: string
}

const getPageTitle = (pathname: string): string => {
  const baseTitles: Record<string, string> = {
    "/": "Dashboard - Control de Gastos",
    "/form": "Registrar Gasto - Control de Gastos", 
    "/estadisticas": "Estadísticas - Control de Gastos",
    "/presupuesto": "Presupuestos - Control de Gastos",
    "/datos": "Datos - Control de Gastos"
  }

  // Rutas dinámicas
  if (pathname.startsWith("/presupuesto/")) {
    return "Detalle Presupuesto - Control de Gastos"
  }

  return baseTitles[pathname] || "Control de Gastos"
}

export function PageTitle({ customTitle }: PageTitleProps) {
  const pathname = usePathname()

  useEffect(() => {
    const title = customTitle || getPageTitle(pathname)
    document.title = title
  }, [pathname, customTitle])

  return null
}
