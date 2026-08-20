"use client"

import { formatMoney } from "@/lib/utils"
import type { MonthlyDataGrid } from "@/services/budget-general"

interface Props {
  monthlyData: MonthlyDataGrid
  activeMonths: string[]
  anio: string
}

/**
 * Resumen del año sobre la cuadrícula: hasta ahora había que sumar las tarjetas
 * mentalmente para saber cómo iba el año completo.
 */
export function YearSummary({ monthlyData, activeMonths, anio }: Props) {
  const meses = activeMonths.map(m => monthlyData[m]).filter(Boolean)
  const total = meses.reduce((s, m) => s + m.total, 0)
  const gastos = meses.reduce((s, m) => s + m.expenses, 0)
  const conMovimiento = meses.filter(m => m.expenses > 0)
  const promedioMensual = conMovimiento.length > 0
    ? conMovimiento.reduce((s, m) => s + m.total, 0) / conMovimiento.length
    : 0

  const mayor = meses.reduce<{ nombre: string; total: number } | null>((max, m, i) => {
    if (!max || m.total > max.total) return { nombre: activeMonths[i], total: m.total }
    return max
  }, null)

  const celdas = [
    { etiqueta: `Total ${anio}`, valor: formatMoney(total), pie: `${meses.length} ${meses.length === 1 ? "mes" : "meses"}` },
    { etiqueta: "Promedio mensual", valor: formatMoney(promedioMensual), pie: `${conMovimiento.length} con movimiento` },
    { etiqueta: "Gastos registrados", valor: String(gastos), pie: gastos > 0 ? `${formatMoney(total / gastos)} promedio` : "—" },
    {
      etiqueta: "Mes más alto",
      valor: mayor && mayor.total > 0 ? formatMoney(mayor.total) : "—",
      pie: mayor && mayor.total > 0 ? mayor.nombre.charAt(0).toUpperCase() + mayor.nombre.slice(1) : "sin datos",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border rounded-xl border border-border bg-card overflow-hidden">
      {celdas.map(c => (
        <div key={c.etiqueta} className="px-4 py-3.5 sm:px-5 sm:py-4">
          <p className="text-xs font-medium text-muted-foreground">{c.etiqueta}</p>
          <p className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground tabular-nums mt-1">
            {c.valor}
          </p>
          <p className="text-xs text-muted-foreground mt-1 truncate">{c.pie}</p>
        </div>
      ))}
    </div>
  )
}
