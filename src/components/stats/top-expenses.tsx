"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatMoney, formatDate } from "@/lib/utils"
import { getCategoriaColor } from "@/lib/constants"

interface TopGasto {
  id: number | string
  descripcion: string
  monto: number
  fecha: string
  categoria: string
  porcentaje: number
}

/**
 * Los promedios esconden los picos. Ver las transacciones grandes de una es
 * lo que suele explicar por qué un mes se disparó.
 */
export function TopExpenses({ gastos }: { gastos: TopGasto[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="px-5 pt-5 pb-3">
        <CardTitle className="text-base font-semibold">Gastos más grandes</CardTitle>
        <p className="text-xs text-muted-foreground">Las transacciones que más pesan en el período</p>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        {gastos.length === 0 ? (
          <p className="text-sm text-muted-foreground px-5 py-8 text-center">Sin gastos en este período.</p>
        ) : (
          gastos.map((g, i) => (
            <div
              key={g.id}
              className="flex items-center gap-3 px-5 py-2.5 border-b border-border last:border-b-0"
            >
              <span className="text-xs text-muted-foreground tabular-nums w-4 shrink-0">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{g.descripcion}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`border font-normal ${getCategoriaColor(g.categoria)}`}>
                    {g.categoria}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(g.fecha)}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-foreground tabular-nums">{formatMoney(g.monto)}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{g.porcentaje.toFixed(0)}% del total</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
