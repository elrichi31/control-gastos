"use client"

import { formatMoney } from "@/lib/utils"
import { Wallet, CalendarDays, Receipt, TrendingUp } from "lucide-react"
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
  const entries = activeMonths.filter(m => monthlyData[m]).map(nombre => ({ nombre, ...monthlyData[nombre] }))
  const meses = entries
  const total = meses.reduce((s, m) => s + m.total, 0)
  const gastos = meses.reduce((s, m) => s + m.expenses, 0)
  const conMovimiento = meses.filter(m => m.expenses > 0)
  const promedioMensual = conMovimiento.length > 0
    ? conMovimiento.reduce((s, m) => s + m.total, 0) / conMovimiento.length
    : 0

  const mayor = meses.reduce<{ nombre: string; total: number } | null>((max, m) => {
    if (!max || m.total > max.total) return { nombre: m.nombre, total: m.total }
    return max
  }, null)

  const celdas = [
    { icon: Wallet, color: "text-primary", etiqueta: `Total ${anio}`, valor: formatMoney(total), pie: `${meses.length} ${meses.length === 1 ? "mes" : "meses"}` },
    { icon: CalendarDays, color: "text-chart-4", etiqueta: "Promedio mensual", valor: formatMoney(promedioMensual), pie: `${conMovimiento.length} con movimiento` },
    { icon: Receipt, color: "text-chart-1", etiqueta: "Gastos registrados", valor: String(gastos), pie: gastos > 0 ? `${formatMoney(total / gastos)} promedio` : "—" },
    {
      icon: TrendingUp, color: "text-chart-3", etiqueta: "Mes más alto",
      valor: mayor && mayor.total > 0 ? formatMoney(mayor.total) : "—",
      pie: mayor && mayor.total > 0 ? mayor.nombre.charAt(0).toUpperCase() + mayor.nombre.slice(1) : "sin datos",
    },
  ]

  return (
    <div>
      <h2 className="text-sm font-medium mb-3">Gasto registrado <span className="text-muted-foreground font-normal">· {anio}</span></h2>
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border rounded-xl border border-border bg-card overflow-hidden">
      {celdas.map(c => (
        <div key={c.etiqueta} className={`min-w-0 px-4 py-3.5 sm:px-5 sm:py-4 ${c.icon === Wallet ? "bg-primary/5" : ""}`}>
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><c.icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${c.color}`} />{c.etiqueta}</p>
          <p className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground tabular-nums mt-2 break-words">
            {c.valor}
          </p>
          <p className="text-xs text-muted-foreground mt-1 truncate">{c.pie}</p>
        </div>
      ))}
      </div>
    </div>
  )
}
