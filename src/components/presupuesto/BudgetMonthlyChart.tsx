"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { monthlyChartData } from '@/lib/budget-chart'
import { formatMoney } from '@/lib/utils'
import type { MonthlyDataGrid } from '@/services/budget-general'

export function BudgetMonthlyChart({ monthlyData, activeMonths, year }: {
  monthlyData: MonthlyDataGrid; activeMonths: string[]; year: string
}) {
  // SVG/CSS tokens update immediately when the theme changes.
  const theme = { actual: 'hsl(var(--chart-1))', grid: 'hsl(var(--border))', eje: 'hsl(var(--muted-foreground))', superficie: 'hsl(var(--popover))', borde: 'hsl(var(--border))', texto: 'hsl(var(--popover-foreground))' }
  const data = monthlyChartData(monthlyData, activeMonths)
  const hasData = data.some(point => point.amount !== null)
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Evolución mensual · {year}</CardTitle>
        <p className="text-xs text-muted-foreground">Gasto registrado en los meses de tu presupuesto.</p>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-64 sm:h-72" role="img" aria-label={`Gráfica de gasto registrado por mes de ${year}. Los valores también están disponibles debajo.`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} accessibilityLayer margin={{ top: 12, right: 8, left: 0, bottom: 16 }}>
                <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke={theme.eje} fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={12} label={{ value: 'Mes', position: 'insideBottom', offset: -12, fill: theme.eje, fontSize: 11 }} />
                <YAxis stroke={theme.eje} fontSize={11} width={56} tickLine={false} axisLine={false} tickFormatter={value => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(Number(value))} />
                <Tooltip labelFormatter={label => data.find(point => point.label === label)?.month ?? label} formatter={value => [formatMoney(Number(value)), 'Gasto registrado']} contentStyle={{ background: theme.superficie, borderColor: theme.borde, color: theme.texto, borderRadius: 8, fontSize: 12 }} cursor={{ fill: theme.grid, fillOpacity: 0.25 }} />
                <Bar dataKey="amount" name="Gasto registrado" fill={theme.actual} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay montos disponibles para este año.</p>}
        <details className="mt-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer w-fit rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">Ver montos por mes</summary>
          <dl className="mt-3 grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
            {data.map(point => <div key={point.month} className="flex justify-between gap-3"><dt>{point.month}</dt><dd className="tabular-nums text-foreground">{point.amount === null ? 'Sin datos' : formatMoney(point.amount)}</dd></div>)}
          </dl>
        </details>
      </CardContent>
    </Card>
  )
}
