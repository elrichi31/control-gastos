"use client"

import { ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useChartTheme } from "@/hooks/useChartTheme"
import { formatDateWithLocale, formatMoney } from "@/lib/utils"
import type { ExpenseForecast } from "@/lib/expense-forecast"

const summaryClass = "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md text-sm font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"

export function ProjectionCard({ forecast: f }: { forecast: ExpenseForecast }) {
  const t = useChartTheme()
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
                <div className="mt-5 h-60 min-w-0" role="img" aria-label="Gasto registrado con línea continua y estimado con línea discontinua. Valores disponibles en Ver datos por día.">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={f.points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
                      <CartesianGrid stroke={t.grid} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" stroke={t.eje} tickLine={false} axisLine={false} fontSize={12} minTickGap={24} />
                      <YAxis stroke={t.eje} tickLine={false} axisLine={false} fontSize={12} width={58} tickFormatter={v => `$${Math.round(v)}`} />
                      <Tooltip labelFormatter={label => `Día ${label}`} formatter={(value, name) => [formatMoney(Number(value)), name]} contentStyle={{ background: t.superficie, borderColor: t.borde, borderRadius: 8, color: t.texto }} />
                      <Line dataKey="actual" name="Registrado" type="linear" stroke={t.actual} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
                      <Line dataKey="forecast" name="Estimado" type="linear" stroke={t.previo} strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} connectNulls={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span aria-hidden="true" className="w-5 border-t-2" style={{ borderColor: t.actual }} />Registrado</span><span className="flex items-center gap-2"><span aria-hidden="true" className="w-5 border-t-2 border-dashed" style={{ borderColor: t.previo }} />Estimado</span></div>
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
      <Card>
        <CardHeader><CardTitle>Recurrentes previstos</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">Desde hoy hasta fin de mes, sin duplicar movimientos ya registrados.</p>
          {f.upcoming.length ? <ul className="divide-y divide-border">{f.upcoming.slice(0, 5).map(item => <li key={`${item.ruleId}:${item.date}`} className="flex gap-3 py-3 first:pt-0"><div className="min-w-0 flex-1"><p className="text-sm font-medium break-words">{item.description}</p><time dateTime={item.date} className="text-xs text-muted-foreground">{formatDateWithLocale(item.date, 'd MMM')}</time></div><span className="shrink-0 text-sm tabular-nums">{formatMoney(item.amount)}</span></li>)}</ul> : <p className="text-sm">Sin recurrentes próximos configurados.</p>}
          {f.upcoming.length > 5 && <details className="mt-2"><summary className={summaryClass}>Ver {f.upcoming.length - 5} más<ChevronDown aria-hidden="true" className="h-4 w-4" /></summary><ul>{f.upcoming.slice(5).map(item => <li key={`${item.ruleId}:${item.date}`} className="py-2 text-sm break-words">{item.description}: {formatMoney(item.amount)} ({formatDateWithLocale(item.date, 'd MMM')})</li>)}</ul></details>}
          <p className="mt-3 text-xs text-muted-foreground">Fechas e importes configurados, no pagos confirmados.</p>
        </CardContent>
      </Card>
      <details className="group rounded-xl border border-border bg-card px-5 py-2">
        <summary className={summaryClass}>Cómo se calcula y qué puede faltar<ChevronDown aria-hidden="true" className="h-4 w-4 group-open:rotate-180" /></summary>
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">Comparamos el ritmo del mes, el patrón por día de semana de hasta tres meses anteriores y una mezcla de ambos. Con al menos tres pruebas comparables elegimos el menor error histórico.</p>
        {f.models.length > 0 && <table className="mt-3 w-full text-left text-sm"><caption className="pb-2 text-left text-xs text-muted-foreground">Error del gasto variable en {f.backtest.length} meses al mismo corte. No usamos el futuro para entrenar.</caption><thead><tr className="border-b border-border"><th className="pb-2 font-medium">Método</th><th className="pb-2 pl-3 text-right font-medium">Error medio</th></tr></thead><tbody>{f.models.map(m => <tr key={m.method} className="border-b border-border last:border-0"><td className="py-3">{m.label}{m.method === f.method && <span className="block text-xs text-muted-foreground">En uso</span>}</td><td className="py-3 pl-3 text-right tabular-nums">{m.mae == null ? 'Sin pruebas' : formatMoney(m.mae)}</td></tr>)}</tbody></table>}
        <p className="mt-3 max-w-prose text-xs text-muted-foreground">Historia de hasta 9 meses cerrados; excluimos el primer mes si comenzó a mitad y los meses sin registros. El rango usa desvíos observados: no es un intervalo de confianza ni una garantía.</p>
        <ul className="my-3 max-w-prose space-y-2 text-sm text-muted-foreground">{f.warnings.map(w => <li key={w}>{w}</li>)}</ul>
      </details>
      {f.projected != null && <details className="group rounded-xl border border-border bg-card px-5 py-2">
        <summary className={summaryClass}>Ver datos por día<ChevronDown aria-hidden="true" className="h-4 w-4 group-open:rotate-180" /></summary>
        <table className="my-3 w-full text-sm"><caption className="mb-3 text-left text-xs text-muted-foreground">Importes acumulados. Hoy puede incluir gasto variable estimado aún por registrar.</caption><thead><tr className="border-b border-border text-left"><th className="py-2 font-medium">Día</th><th className="py-2 text-right font-medium">Registrado</th><th className="py-2 text-right font-medium">Estimado</th></tr></thead><tbody>{f.points.map(p => <tr key={p.day} className="border-b border-border last:border-0"><th scope="row" className="py-2 text-left font-normal">{p.day}</th><td className="py-2 text-right tabular-nums">{p.actual == null ? '-' : formatMoney(p.actual)}</td><td className="py-2 text-right tabular-nums">{p.forecast == null ? '-' : formatMoney(p.forecast)}</td></tr>)}</tbody></table>
      </details>}
    </div>
  )
}
