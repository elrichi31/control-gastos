"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDateWithLocale, formatMoney } from "@/lib/utils"
import { getCategoriaColor } from "@/lib/constants"
import { Gasto } from "@/types"

interface RecentExpensesProps {
  expenses: Gasto[]
  totalCount: number
}

export function RecentExpenses({ expenses, totalCount }: RecentExpensesProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 px-5 pt-5 pb-3">
        <CardTitle className="text-base font-semibold">Gastos recientes</CardTitle>
        {totalCount > expenses.length && (
          <Link
            href="/detalle-gastos"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver todos
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-0 pb-2 flex-1">
        {expenses.length === 0 ? (
          <div className="text-center px-5 py-10">
            <p className="text-sm text-muted-foreground">Todavía no hay gastos registrados.</p>
            <Link href="/form">
              <Button variant="outline" size="sm" className="mt-4">
                Agregar tu primer gasto
              </Button>
            </Link>
          </div>
        ) : (
          expenses.map(gasto => (
            <div
              key={gasto.id}
              className="flex items-center gap-3 px-5 py-2.5 border-b border-border last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{gasto.descripcion}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`border font-normal ${getCategoriaColor(gasto.categoria?.nombre)}`}>
                    {gasto.categoria?.nombre}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateWithLocale(gasto.fecha, "d MMM")}
                  </span>
                </div>
              </div>
              <span className="text-sm font-medium text-foreground tabular-nums shrink-0">
                {formatMoney(gasto.monto)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
