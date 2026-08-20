"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney } from "@/lib/utils"

interface CategoryProgress {
  id: number
  nombre: string
  icono: string
  gastado: number
  presupuestado: number
}

interface BudgetCategoryProgressProps {
  categories: CategoryProgress[]
}

export function BudgetCategoryProgress({ categories }: BudgetCategoryProgressProps) {
  const validCategories = categories
    .filter(cat => cat.presupuestado > 0)
    .sort((a, b) => b.gastado / b.presupuestado - a.gastado / a.presupuestado)

  if (validCategories.length === 0) return null

  const excedidas = validCategories.filter(c => c.gastado > c.presupuestado).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Presupuesto por categoría</CardTitle>
        <p className="text-xs text-muted-foreground">
          {excedidas > 0
            ? `${excedidas} ${excedidas === 1 ? "categoría excedida" : "categorías excedidas"} este mes`
            : "Ninguna categoría excedida este mes"}
        </p>
      </CardHeader>
      <CardContent className="space-y-3.5">
        {validCategories.map(category => {
          const porcentaje = (category.gastado / category.presupuestado) * 100
          const excedido = porcentaje > 100
          const restante = category.presupuestado - category.gastado

          // Mismos umbrales y colores que la vista de presupuesto
          const colorBarra = excedido ? "bg-chart-5" : porcentaje >= 80 ? "bg-chart-3" : "bg-chart-2"

          return (
            <div key={category.id}>
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <span className="text-sm text-foreground truncate">{category.nombre}</span>
                <span className="text-sm tabular-nums shrink-0">
                  <span className={excedido ? "text-chart-5 font-medium" : "text-foreground font-medium"}>
                    {formatMoney(category.gastado)}
                  </span>
                  <span className="text-muted-foreground"> / {formatMoney(category.presupuestado)}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${colorBarra}`}
                    style={{ width: `${Math.min(100, porcentaje)}%` }}
                  />
                </div>
                <span
                  className={`text-xs tabular-nums shrink-0 text-right ${
                    excedido ? "text-chart-5" : "text-muted-foreground"
                  }`}
                >
                  <span className="sm:hidden">{Math.round(porcentaje)}%</span>
                  <span className="hidden sm:inline w-28 inline-block">
                    {excedido
                      ? `${formatMoney(Math.abs(restante))} de más`
                      : `${formatMoney(restante)} disponible`}
                  </span>
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
