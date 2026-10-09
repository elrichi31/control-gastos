"use client"

import { Area, Bar, BarChart, ComposedChart, CartesianGrid, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowDownRight, ArrowUpRight, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useChartTheme, colorParaCategoria } from "@/hooks/useChartTheme"
import { formatDateWithLocale, formatMoney } from "@/lib/utils"
import type { ExpenseForecast } from "@/lib/expense-forecast"

const compact = (v: number) => Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`
const pct = (a: number, b: number) => b > 0 ? (a - b) / b * 100 : null
const monthName = (m: string) => formatDateWithLocale(`${m}-01`, 'MMMM')

function Delta({ value }: { value: number | null }) {
  if (value == null || Math.abs(value) < 1) return <span className="text-muted-foreground">—</span>
  const up = value > 0
  return <span className={`inline-flex items-center gap-0.5 tabular-nums ${up ? 'text-chart-5' : 'text-chart-2'}`}>{up ? <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /> : <ArrowDownRight aria-hidden="true" className="h-3.5 w-3.5" />}{Math.abs(value).toFixed(0)}%</span>
}

const summaryClass = "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md text-sm font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"

export function ProjectionCard({ forecast: f }: { forecast: ExpenseForecast }) {
  const t = useChartTheme()
  const day = Number(f.today.slice(8, 10))
  const prev = f.previous
  const vsPrev = prev && f.projected != null ? pct(f.projected, prev.total) : null
  const chosenBacktest = f.method ? f.backtest.map(b => ({ month: monthName(b.month), real: b.actual, estimado: b.predictions[f.method!] })) : []
  const tooltipStyle = { background: t.superficie, borderColor: t.borde, borderRadius: 8, color: t.texto }
  const status = f.status === 'validated' ? 'Validación histórica' : f.status === 'initial' ? 'Estimación inicial' : 'Historial insuficiente'
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div><CardTitle>Cierre de {formatDateWithLocale(`${f.month}-01`, 'MMMM yyyy')}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Datos al {formatDateWithLocale(f.today, 'd MMM')}. Estimación, no saldo bancario.</p></div>
          <Badge variant="outline" className="font-normal">{status}</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.7fr)]">
            <div className="min-w-0">
              {f.projected == null ? <div className="py-2"><p className="text-base font-medium">Aún no hay una base suficiente para estimar el cierre.</p><p className="mt-2 text-sm text-muted-foreground">Registra el mes desde el inicio durante al menos 7 días completos, o reúne dos meses anteriores con datos.</p></div> : <>
                <p className="text-sm text-muted-foreground">Gasto estimado al finalizar el mes</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums break-words">{formatMoney(f.projected)}</p>
                <p className="mt-2 text-sm text-muted-foreground">Método: <span className="text-foreground">{f.methodLabel}</span></p>
                {f.range && <p className="mt-2 text-sm text-muted-foreground">Rango por desvíos anteriores: <span className="font-medium tabular-nums text-foreground">{formatMoney(f.range.low)} a {formatMoney(f.range.high)}</span></p>}
                {prev && <dl className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-border p-3 text-sm sm:grid-cols-3">
                  <div><dt className="text-xs text-muted-foreground">Cierre de {monthName(prev.month)}</dt><dd className="mt-1 font-medium tabular-nums">{formatMoney(prev.total)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Estimado vs {monthName(prev.month)}</dt><dd className="mt-1 font-medium"><Delta value={vsPrev} /></dd></div>
                  <div><dt className="text-xs text-muted-foreground">Para no superarlo</dt><dd className="mt-1 font-medium tabular-nums">{f.dailyAllowance! > 0 ? <>{formatMoney(f.dailyAllowance!)}<span className="font-normal text-muted-foreground"> / día</span></> : <span className="text-chart-5">Ya superado</span>}</dd></div>
                </dl>}
                <div className="mt-5 h-60 min-w-0" role="img" aria-label="Gasto acumulado registrado, estimado con línea discontinua y mes anterior como referencia. Valores disponibles en Ver datos por día.">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={f.points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
                      <defs><linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.actual} stopOpacity={0.25} /><stop offset="100%" stopColor={t.actual} stopOpacity={0.02} /></linearGradient></defs>
                      <CartesianGrid stroke={t.grid} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" stroke={t.eje} tickLine={false} axisLine={false} fontSize={12} minTickGap={24} />
                      <YAxis stroke={t.eje} tickLine={false} axisLine={false} fontSize={12} width={58} tickFormatter={compact} />
                      <Tooltip labelFormatter={label => `Día ${label}`} formatter={(value, name) => [formatMoney(Number(value)), name]} contentStyle={tooltipStyle} />
                      <ReferenceLine x={day} stroke={t.eje} strokeDasharray="2 2" label={{ value: 'Hoy', position: 'insideTopLeft', fill: t.eje, fontSize: 11 }} />
                      {prev && <ReferenceLine y={prev.total} stroke={t.previo} strokeOpacity={0.4} />}
                      {prev && <Line dataKey="previous" name={`Mes de ${monthName(prev.month)}`} type="monotone" stroke={t.previo} strokeWidth={1.5} dot={false} isAnimationActive={false} />}
                      <Area dataKey="actual" name="Registrado" type="linear" stroke={t.actual} strokeWidth={2} fill="url(#gradForecast)" dot={false} isAnimationActive={false} connectNulls={false} />
                      <Line dataKey="forecast" name="Estimado" type="linear" stroke={t.actual} strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} connectNulls={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span aria-hidden="true" className="w-5 border-t-2" style={{ borderColor: t.actual }} />Registrado</span><span className="flex items-center gap-2"><span aria-hidden="true" className="w-5 border-t-2 border-dashed" style={{ borderColor: t.actual }} />Estimado</span>{prev && <span className="flex items-center gap-2"><span aria-hidden="true" className="w-5 border-t" style={{ borderColor: t.previo }} />Mes de {monthName(prev.month)}</span>}</div>
              </>}
            </div>
            <div className="min-w-0 border-t border-border pt-5 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
              <h3 className="text-sm font-semibold">Qué forma el cierre</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2"><dt className="text-muted-foreground">Registrado hasta hoy</dt><dd className="tabular-nums font-medium">{formatMoney(f.recordedToDate)}</dd></div>
                {f.futureRecorded > 0 && <div className="flex flex-wrap justify-between gap-2"><dt className="text-muted-foreground">Registrado con fecha futura</dt><dd className="tabular-nums font-medium">{formatMoney(f.futureRecorded)}</dd></div>}
                <div className="flex flex-wrap justify-between gap-2"><dt className="text-muted-foreground">Recurrentes por registrar</dt><dd className="tabular-nums font-medium">{formatMoney(f.committed)}</dd></div>
                <div className="flex flex-wrap justify-between gap-2"><dt className="text-muted-foreground">Variable por estimar</dt><dd className="tabular-nums font-medium">{f.variableRemaining == null ? 'Sin base' : formatMoney(f.variableRemaining)}</dd></div>
                <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-3"><dt>Mínimo conocido</dt><dd className="tabular-nums font-semibold">{formatMoney(f.floor)}</dd></div>
              </dl>
              <section className="mt-5 border-t border-border pt-4" aria-label="Error histórico">
                <h3 className="text-sm font-semibold">¿Cuánto se equivocó antes?</h3>
                {f.status === 'validated' && f.errorTypical != null ? <><p className="mt-2 text-xl font-semibold tabular-nums">{formatMoney(f.errorTypical)}</p><p className="mt-1 text-sm text-muted-foreground">Error absoluto medio del gasto variable en {f.backtest.length} meses de prueba. Menor es mejor.</p></> : <p className="mt-2 text-sm text-muted-foreground">No hay suficientes meses comparables para medir un error fiable. No mostramos un porcentaje de precisión.</p>}
                <p className="mt-3 text-xs text-muted-foreground">Prueba retrospectiva sobre los registros actuales; no garantiza el próximo cierre ni la exactitud de los recurrentes.</p>
              </section>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardHeader><CardTitle>Por categoría</CardTitle><p className="mt-1 text-sm text-muted-foreground">Cierre de cada categoría si sigue su ritmo del mes.</p></CardHeader>
          <CardContent>
            {f.categories.length === 0 ? <p className="text-sm text-muted-foreground">Sin gastos registrados todavía.</p> : <div className="-mx-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="px-2 py-2 font-medium">Categoría</th><th className="px-2 py-2 text-right font-medium">A hoy</th><th className="px-2 py-2 text-right font-medium">Estimado</th>{prev && <><th className="px-2 py-2 text-right font-medium capitalize">{monthName(prev.month)}</th><th className="px-2 py-2 text-right font-medium">Var.</th></>}</tr></thead>
                <tbody>{f.categories.slice(0, 8).map(c => <tr key={c.name} className="border-b border-border last:border-0">
                  <th scope="row" className="px-2 py-2.5 text-left font-normal"><span className="flex min-w-0 items-center gap-2"><span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: colorParaCategoria(c.name, t.serie) }} /><span className="max-w-[10rem] truncate">{c.name}</span></span></th>
                  <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">{formatMoney(c.recorded)}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums font-medium">{c.projected == null ? '—' : formatMoney(c.projected)}</td>
                  {prev && <><td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">{formatMoney(c.previous)}</td><td className="px-2 py-2.5 text-right text-xs"><Delta value={c.projected == null ? null : pct(c.projected, c.previous)} /></td></>}
                </tr>)}</tbody>
              </table>
            </div>}
            <p className="mt-3 text-xs text-muted-foreground">Ritmo lineal por categoría; los recurrentes por registrar no se reparten aquí.</p>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader><CardTitle>Recurrentes previstos</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">Desde hoy hasta fin de mes, sin duplicar movimientos ya registrados.</p>
            {f.upcoming.length ? <ul className="divide-y divide-border">{f.upcoming.slice(0, 5).map(item => <li key={`${item.ruleId}:${item.date}`} className="flex gap-3 py-3 first:pt-0"><div className="min-w-0 flex-1"><p className="text-sm font-medium break-words">{item.description}</p><time dateTime={item.date} className="text-xs text-muted-foreground">{formatDateWithLocale(item.date, 'd MMM')}</time></div><span className="shrink-0 text-sm tabular-nums">{formatMoney(item.amount)}</span></li>)}</ul> : <p className="text-sm">Sin recurrentes próximos configurados.</p>}
            {f.upcoming.length > 5 && <details className="mt-2"><summary className={summaryClass}>Ver {f.upcoming.length - 5} más<ChevronDown aria-hidden="true" className="h-4 w-4" /></summary><ul>{f.upcoming.slice(5).map(item => <li key={`${item.ruleId}:${item.date}`} className="py-2 text-sm break-words">{item.description}: {formatMoney(item.amount)} ({formatDateWithLocale(item.date, 'd MMM')})</li>)}</ul></details>}
            <p className="mt-3 text-xs text-muted-foreground">Fechas e importes configurados, no pagos confirmados.</p>
          </CardContent>
        </Card>
      </div>
      {chosenBacktest.length > 0 && <Card>
        <CardHeader><CardTitle>Así le fue al método en meses anteriores</CardTitle><p className="mt-1 text-sm text-muted-foreground">Gasto variable real contra lo que habría estimado al mismo día de cada mes.</p></CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="h-56 min-w-0" role="img" aria-label="Barras de gasto variable real y estimado por mes de prueba.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chosenBacktest} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
                <CartesianGrid stroke={t.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke={t.eje} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke={t.eje} tickLine={false} axisLine={false} fontSize={12} width={58} tickFormatter={compact} />
                <Tooltip cursor={{ fill: t.grid, opacity: 0.4 }} formatter={(value, name) => [formatMoney(Number(value)), name === 'real' ? 'Real' : 'Estimado']} contentStyle={tooltipStyle} />
                <Bar dataKey="real" fill={t.actual} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="estimado" fill={t.previo} fillOpacity={0.6} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="min-w-0">
            <table className="w-full text-sm"><caption className="pb-2 text-left text-xs text-muted-foreground">Cierre estimado y error medio de cada método en {f.backtest.length} meses. Menor error es mejor.</caption>
              <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2 font-medium">Método</th><th className="py-2 pl-3 text-right font-medium">Cierre</th><th className="py-2 pl-3 text-right font-medium">Error medio</th></tr></thead>
              <tbody>{f.models.map(m => <tr key={m.method} className="border-b border-border last:border-0"><th scope="row" className="py-2.5 text-left font-normal">{m.label}{m.method === f.method && <span className="block text-xs text-muted-foreground">En uso</span>}</th><td className="py-2.5 pl-3 text-right tabular-nums">{formatMoney(m.projected)}</td><td className="py-2.5 pl-3 text-right tabular-nums">{m.mae == null ? 'Sin pruebas' : formatMoney(m.mae)}</td></tr>)}</tbody>
            </table>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: t.actual }} />Real</span><span className="flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm opacity-60" style={{ background: t.previo }} />Estimado</span></div>
          </div>
        </CardContent>
      </Card>}
      <details className="group rounded-xl border border-border bg-card px-5 py-2">
        <summary className={summaryClass}>Cómo se calcula y qué puede faltar<ChevronDown aria-hidden="true" className="h-4 w-4 group-open:rotate-180" /></summary>
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">Comparamos el ritmo del mes, el patrón por día de semana de hasta tres meses anteriores y una mezcla de ambos. Con al menos tres pruebas comparables elegimos el menor error histórico.</p>
        <p className="mt-3 max-w-prose text-xs text-muted-foreground">Historia de hasta 9 meses cerrados; excluimos el primer mes si comenzó a mitad y los meses sin registros. El rango usa desvíos observados: no es un intervalo de confianza ni una garantía.</p>
        <ul className="my-3 max-w-prose space-y-2 text-sm text-muted-foreground">{f.warnings.map(w => <li key={w}>{w}</li>)}</ul>
      </details>
      {f.projected != null && <details className="group rounded-xl border border-border bg-card px-5 py-2">
        <summary className={summaryClass}>Ver datos por día<ChevronDown aria-hidden="true" className="h-4 w-4 group-open:rotate-180" /></summary>
        <table className="my-3 w-full text-sm"><caption className="mb-3 text-left text-xs text-muted-foreground">Importes acumulados. Hoy puede incluir gasto variable estimado aún por registrar.</caption><thead><tr className="border-b border-border text-left"><th className="py-2 font-medium">Día</th><th className="py-2 text-right font-medium">Registrado</th><th className="py-2 text-right font-medium">Estimado</th>{prev && <th className="py-2 text-right font-medium capitalize">{monthName(prev.month)}</th>}</tr></thead><tbody>{f.points.map(p => <tr key={p.day} className="border-b border-border last:border-0"><th scope="row" className="py-2 text-left font-normal">{p.day}</th><td className="py-2 text-right tabular-nums">{p.actual == null ? '-' : formatMoney(p.actual)}</td><td className="py-2 text-right tabular-nums">{p.forecast == null ? '-' : formatMoney(p.forecast)}</td>{prev && <td className="py-2 text-right tabular-nums text-muted-foreground">{p.previous == null ? '-' : formatMoney(p.previous)}</td>}</tr>)}</tbody></table>
      </details>}
    </div>
  )
}
