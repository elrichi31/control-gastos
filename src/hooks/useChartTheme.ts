"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

/**
 * Recharts necesita colores reales, no clases de Tailwind. Este hook resuelve
 * los tokens CSS a valores concretos y los recalcula cuando cambia el tema,
 * para que los gráficos sigan la misma paleta que el resto de la app.
 */
export interface ChartTheme {
  serie: string[]
  actual: string
  previo: string
  grid: string
  eje: string
  texto: string
  superficie: string
  borde: string
  positivo: string
  negativo: string
}

const FALLBACK: ChartTheme = {
  serie: ["#529cca", "#4dab9a", "#ffa344", "#9a6dd7", "#ff7369"],
  actual: "#529cca",
  previo: "#7f7f7f",
  grid: "#2b2b2b",
  eje: "#7f7f7f",
  texto: "#d4d4d4",
  superficie: "#262626",
  borde: "#2b2b2b",
  positivo: "#4dab9a",
  negativo: "#ff7369",
}

export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme()
  const [theme, setTheme] = useState<ChartTheme>(FALLBACK)

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement)
    const token = (name: string, fallback: string) => {
      const raw = cs.getPropertyValue(name).trim()
      return raw ? `hsl(${raw})` : fallback
    }

    setTheme({
      serie: [
        token("--chart-1", FALLBACK.serie[0]),
        token("--chart-2", FALLBACK.serie[1]),
        token("--chart-3", FALLBACK.serie[2]),
        token("--chart-4", FALLBACK.serie[3]),
        token("--chart-5", FALLBACK.serie[4]),
      ],
      actual: token("--chart-1", FALLBACK.actual),
      previo: token("--muted-foreground", FALLBACK.previo),
      grid: token("--border", FALLBACK.grid),
      eje: token("--muted-foreground", FALLBACK.eje),
      texto: token("--foreground", FALLBACK.texto),
      superficie: token("--popover", FALLBACK.superficie),
      borde: token("--border", FALLBACK.borde),
      positivo: token("--chart-2", FALLBACK.positivo),
      negativo: token("--chart-5", FALLBACK.negativo),
    })
  }, [resolvedTheme])

  return theme
}

/** Color estable por categoría: el mismo nombre siempre recibe el mismo color. */
export function colorParaCategoria(nombre: string, serie: string[]): string {
  let hash = 0
  for (let i = 0; i < nombre.length; i++) {
    hash = (hash * 31 + nombre.charCodeAt(i)) >>> 0
  }
  return serie[hash % serie.length]
}
