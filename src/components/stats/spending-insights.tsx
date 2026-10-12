"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney, toDateWithTime } from "@/lib/utils"
import type { useStatsAnalytics } from "@/hooks/useStatsAnalytics"

type Analytics = ReturnType<typeof useStatsAnalytics>
type Props = { analytics: Analytics }

function ChartMode({ value, onChange, labels }: { value: boolean; onChange: (value: boolean) => void; labels: [string, string] }) {
  return <div className="inline-flex shrink-0 rounded-md border border-border bg-muted/50 p-0.5">
    {labels.map((label, i) => <button key={label} type="button" aria-pressed={value === !!i}
      onClick={() => onChange(!!i)}
      className={`min-h-10 rounded-sm px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${value === !!i ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>)}
  </div>
}

export function InsightsSummary({ analytics: a }: Props) {
  if (!a.kpis.transacciones) return <div className="rounded-xl border border-dashed border-border p-6 text-center">
    <p className="font-medium">No hay gastos en este período</p>
    <p className="mt-1 text-sm text-muted-foreground">Prueba otro período o registra un gasto para ver tus patrones.</p>
  </div>
  const cambio = a.cambiosCategoria.find(c => c.diferencia !== 0)
  const pequeno = a.porTamano[0]
  return <section aria-label="Qué destaca" className="rounded-xl border border-border bg-card px-5 py-4">
    <h2 className="text-sm font-semibold">Qué destaca</h2>
    <div className="mt-3 grid gap-4 md:grid-cols-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{cambio ? "Mayor cambio en dinero" : "Categoría principal"}</p>
        <p className="mt-1 break-words text-sm font-medium">{cambio ? `${cambio.nombre}: ${cambio.diferencia > 0 ? "subió" : "bajó"} ${formatMoney(Math.abs(cambio.diferencia))}` : a.porCategoria[0]?.nombre}</p>
        <p className="mt-1 text-xs text-muted-foreground">{cambio ? "Frente al período anterior comparable." : `${a.porCategoria[0]?.porcentaje.toFixed(0)}% de tu gasto registrado.`}</p>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Día de mayor gasto</p>
        <p className="mt-1 text-sm font-medium">{a.diaPico && `${format(toDateWithTime(a.diaPico.fecha), "d MMM yyyy", { locale: es })} · ${formatMoney(a.diaPico.total)}`}</p>
        <p className="mt-1 text-xs text-muted-foreground">{a.diaPico?.conteo} compras; no implica un hábito recurrente.</p>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Compras de hasta $10</p>
        <p className="mt-1 text-sm font-medium tabular-nums">{formatMoney(pequeno.total)} en {pequeno.conteo} compras</p>
        <p className="mt-1 text-xs text-muted-foreground">Suman el {pequeno.porcentaje.toFixed(1)}% del gasto del período.</p>
      </div>
    </div>
  </section>
}

export function CategoryChanges({ analytics: a }: Props) {
  const cambios = a.cambiosCategoria.filter(c => c.diferencia !== 0).slice(0, 6)
  const max = Math.max(...cambios.map(c => Math.abs(c.diferencia)), 1)
  return <Card className="h-full min-w-0">
    <CardHeader className="pb-3">
      <CardTitle className="text-base font-semibold">Qué cambió por categoría</CardTitle>
      <p className="text-xs text-muted-foreground">Los 6 mayores cambios en dinero, no en porcentaje. {a.enCurso ? "Mismos días transcurridos del período anterior." : "Frente al período anterior."}</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {!a.kpis.hayComparacion ? <p className="py-4 text-sm text-muted-foreground">No hay gastos en el período anterior comparable. Selecciona otro período para comparar.</p>
        : !cambios.length ? <p className="py-4 text-sm text-muted-foreground">El gasto por categoría no cambió.</p>
        : <>
          <div className="flex justify-between text-xs text-muted-foreground"><span>Menos gasto ←</span><span>→ Más gasto</span></div>
          {cambios.map(c => <div key={c.nombre}>
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-sm">
              <span className="min-w-0 break-words font-medium">{c.nombre}</span>
              <span className="tabular-nums text-xs text-foreground">{c.diferencia > 0 ? "Subió" : "Bajó"} {formatMoney(Math.abs(c.diferencia))}</span>
            </div>
            <div aria-hidden="true" className="relative h-2 overflow-hidden rounded bg-muted">
              <div className={`absolute top-0 h-full rounded ${c.diferencia > 0 ? "bg-chart-5" : "bg-chart-2"}`}
                style={{ width: `${Math.abs(c.diferencia) / max * 50}%`, left: c.diferencia > 0 ? "50%" : `${50 - Math.abs(c.diferencia) / max * 50}%` }} />
              <div className="absolute left-1/2 top-0 h-full w-px bg-muted-foreground" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">Antes {formatMoney(c.previo)} · Ahora {formatMoney(c.actual)}</p>
          </div>)}
        </>}
    </CardContent>
  </Card>
}

export function WeeklySpending({ analytics: a }: Props) {
  const [porDia, setPorDia] = useState(false)
  const max = Math.max(...a.porSemana.map(s => porDia ? s.promedio : s.total), 1)
  return <Card className="h-full min-w-0">
    <CardHeader className="pb-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base font-semibold">Gasto por semana</CardTitle>
        <ChartMode value={porDia} onChange={setPorDia} labels={["Total", "Por día"]} />
      </div>
      <p className="text-xs text-muted-foreground">Bloques de 7 días desde el inicio. Usa «Por día» para comparar semanas parciales.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {!a.porSemana.length ? <p className="py-4 text-sm text-muted-foreground">Selecciona un mes o un rango de hasta 62 días ya iniciado para ver el detalle semanal.</p> : a.porSemana.map(s => <div key={s.etiqueta}>
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-xs">
          <span className="font-medium">{s.etiqueta}</span>
          <span className="font-medium tabular-nums">{formatMoney(porDia ? s.promedio : s.total)}{porDia ? " / día" : ""}</span>
        </div>
        <div aria-hidden="true" className="h-2 overflow-hidden rounded bg-muted"><div className="h-full rounded bg-chart-1" style={{ width: `${(porDia ? s.promedio : s.total) / max * 100}%` }} /></div>
        <p className="mt-1 text-xs text-muted-foreground">{s.conteo} compras · {s.dias} días{s.dias < 7 ? " · semana parcial" : ""}</p>
      </div>)}
    </CardContent>
  </Card>
}

export function PurchaseSizes({ analytics: a }: Props) {
  const [conteo, setConteo] = useState(false)
  const max = Math.max(...a.porTamano.map(b => conteo ? b.conteo : b.total), 1)
  return <Card className="h-full min-w-0">
    <CardHeader className="pb-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base font-semibold">Tamaño de tus compras</CardTitle>
        <ChartMode value={conteo} onChange={setConteo} labels={["Monto", "Compras"]} />
      </div>
      <p className="text-xs text-muted-foreground">¿Muchas compras pequeñas o pocas grandes? Cada compra pertenece a un solo tramo.</p>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {a.porTamano.map(b => <div key={b.etiqueta}>
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 text-xs">
            <span>{b.etiqueta}</span><span className="font-medium tabular-nums">{conteo ? `${b.conteo} compras` : formatMoney(b.total)}</span>
          </div>
          <div aria-hidden="true" className="h-2 overflow-hidden rounded bg-muted"><div className="h-full rounded bg-chart-4" style={{ width: `${(conteo ? b.conteo : b.total) / max * 100}%` }} /></div>
          <p className="mt-1 text-xs text-muted-foreground">{conteo ? formatMoney(b.total) : `${b.conteo} compras`} · {b.porcentaje.toFixed(1)}% del monto total</p>
        </div>)}
      </div>
      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">Compra habitual (mediana)</span><span className="text-sm font-semibold tabular-nums">{a.mediana === null ? "—" : formatMoney(a.mediana)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">La mitad de las compras está por debajo de este valor y la otra mitad por encima.</p>
    </CardContent>
  </Card>
}
