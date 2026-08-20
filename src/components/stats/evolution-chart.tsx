"use client"

import { useState } from "react"
import {
  Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useChartTheme } from "@/hooks/useChartTheme"
import { formatMoney } from "@/lib/utils"

interface Punto {
  etiqueta: string
  actual: number
  previo: number | null
}

interface Props {
  diario: Punto[]
  acumulado: Punto[]
  titulo: string
  /** Nombre del período previo para la leyenda, ej. "julio". */
  etiquetaPrevio?: string
}

const compacto = (v: number) =>
  Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`

export function EvolutionChart({ diario, acumulado, titulo, etiquetaPrevio }: Props) {
  const [modo, setModo] = useState<"diario" | "acumulado">("diario")
  const t = useChartTheme()

  const data = modo === "diario" ? diario : acumulado
  const hayPrevio = data.some(d => d.previo !== null)

  const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div
        className="rounded-lg border px-3 py-2 text-xs shadow-md"
        style={{ background: t.superficie, borderColor: t.borde, color: t.texto }}
      >
        <p className="font-medium mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: t.eje }}>{p.dataKey === "actual" ? "Actual" : etiquetaPrevio ?? "Anterior"}:</span>
            <span className="font-medium tabular-nums">{formatMoney(p.value ?? 0)}</span>
          </p>
        ))}
      </div>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">{titulo}</CardTitle>
          {hayPrevio && (
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: t.actual }} />
                Actual
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-0.5 rounded-sm" style={{ background: t.previo }} />
                {etiquetaPrevio ?? "Período anterior"}
              </span>
            </div>
          )}
        </div>
        {/* Diario responde "cuándo gasté"; acumulado responde "voy adelantado o no" */}
        <div className="inline-flex rounded-md border border-border p-0.5 bg-muted/50">
          {(["diario", "acumulado"] as const).map(m => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors capitalize ${
                modo === m ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.actual} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={t.actual} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={t.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="etiqueta"
                stroke={t.eje}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                stroke={t.eje}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={compacto}
              />
              <Tooltip content={<Tip />} cursor={{ stroke: t.grid }} />
              {hayPrevio && (
                <Line
                  type="monotone"
                  dataKey="previo"
                  stroke={t.previo}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  connectNulls
                />
              )}
              <Area
                type="monotone"
                dataKey="actual"
                stroke={t.actual}
                strokeWidth={2}
                fill="url(#gradActual)"
                dot={false}
                activeDot={{ r: 3.5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
