"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useChartTheme, colorParaCategoria } from "@/hooks/useChartTheme"
import { formatMoney } from "@/lib/utils"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

interface Categoria {
  nombre: string
  total: number
  conteo: number
  porcentaje: number
  previo: number
  delta: number | null
}

interface Props {
  categorias: Categoria[]
  concentracion: number
}

/**
 * Ranking horizontal en vez de pie/radar: con más de 4 categorías una torta
 * deja de ser legible, y comparar longitudes es más preciso que comparar
 * ángulos. Además deja sitio para el % y la variación en la misma fila.
 */
export function CategoryRanking({ categorias, concentracion }: Props) {
  const t = useChartTheme()
  const max = categorias.length > 0 ? categorias[0].total : 0

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Gasto por categoría</CardTitle>
        {categorias.length >= 3 && (
          <p className="text-xs text-muted-foreground">
            Las 3 principales concentran el{" "}
            <span className="font-medium text-foreground tabular-nums">{concentracion.toFixed(0)}%</span> del total
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {categorias.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">Sin gastos en este período.</p>
        )}
        {categorias.map(c => {
          const color = colorParaCategoria(c.nombre, t.serie)
          const sube = c.delta !== null && c.delta > 0
          const relevante = c.delta !== null && Math.abs(c.delta) >= 5
          return (
            <div key={c.nombre}>
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <span className="text-sm text-foreground truncate">{c.nombre}</span>
                <span className="flex items-center gap-2 shrink-0">
                  {relevante && (
                    <span
                      className={`flex items-center gap-0.5 text-xs tabular-nums ${
                        sube ? "text-chart-5" : "text-chart-2"
                      }`}
                      title={`Antes: ${formatMoney(c.previo)}`}
                    >
                      {sube ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(c.delta!).toFixed(0)}%
                    </span>
                  )}
                  <span className="text-sm font-medium text-foreground tabular-nums">
                    {formatMoney(c.total)}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${max > 0 ? (c.total / max) * 100 : 0}%`, background: color }}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums w-16 text-right shrink-0">
                  {c.porcentaje.toFixed(0)}% · {c.conteo}
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
