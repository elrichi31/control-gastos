"use client"

import {
  Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useChartTheme } from "@/hooks/useChartTheme"
import { formatMoney } from "@/lib/utils"

const compacto = (v: number) =>
  Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`

function TooltipCaja({ titulo, filas, t }: { titulo: string; filas: string[]; t: any }) {
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-md"
      style={{ background: t.superficie, borderColor: t.borde, color: t.texto }}
    >
      <p className="font-medium mb-0.5">{titulo}</p>
      {filas.map((f, i) => (
        <p key={i} style={{ color: t.eje }}>{f}</p>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Métodos de pago — este dato ya estaba en la base y no se mostraba   */
/* ------------------------------------------------------------------ */

interface MetodoPago {
  nombre: string
  total: number
  conteo: number
  porcentaje: number
}

export function PaymentMethodChart({ metodos }: { metodos: MetodoPago[] }) {
  const t = useChartTheme()

  if (metodos.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Métodos de pago</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-6 text-center">Sin datos en este período.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-semibold">Métodos de pago</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={metodos}
                dataKey="total"
                nameKey="nombre"
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={68}
                paddingAngle={2}
                stroke="none"
              >
                {metodos.map((m, i) => (
                  <Cell key={m.nombre} fill={t.serie[i % t.serie.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }: any) =>
                  active && payload?.length ? (
                    <TooltipCaja
                      titulo={payload[0].payload.nombre}
                      filas={[
                        `${formatMoney(payload[0].value)} · ${payload[0].payload.porcentaje.toFixed(0)}%`,
                        `${payload[0].payload.conteo} transacciones`,
                      ]}
                      t={t}
                    />
                  ) : null
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1.5 mt-3">
          {metodos.map((m, i) => (
            <div key={m.nombre} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: t.serie[i % t.serie.length] }}
                />
                <span className="text-muted-foreground truncate">{m.nombre}</span>
              </span>
              <span className="text-foreground tabular-nums shrink-0">
                {m.porcentaje.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Patrón por día de la semana                                         */
/* ------------------------------------------------------------------ */

interface DiaSemana {
  dia: string
  total: number
  conteo: number
  promedio: number
}

export function WeekdayChart({ dias }: { dias: DiaSemana[] }) {
  const t = useChartTheme()
  const max = Math.max(...dias.map(d => d.total), 0)
  const pico = dias.find(d => d.total === max && max > 0)

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Patrón semanal</CardTitle>
        <p className="text-xs text-muted-foreground">
          {pico
            ? <>Gastas más los <span className="font-medium text-foreground">{pico.dia}</span></>
            : "Sin gastos en este período."}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dias} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="dia" stroke={t.eje} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={t.eje} fontSize={11} tickLine={false} axisLine={false} width={48} tickFormatter={compacto} />
              <Tooltip
                cursor={{ fill: t.grid, opacity: 0.4 }}
                content={({ active, payload, label }: any) =>
                  active && payload?.length ? (
                    <TooltipCaja
                      titulo={label}
                      filas={[
                        `Total: ${formatMoney(payload[0].value)}`,
                        `${payload[0].payload.conteo} gastos · ${formatMoney(payload[0].payload.promedio)} promedio`,
                      ]}
                      t={t}
                    />
                  ) : null
                }
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {dias.map(d => (
                  <Cell key={d.dia} fill={d.total === max && max > 0 ? t.actual : t.grid} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Recurrente vs puntual — otro dato que ya existía y no se usaba      */
/* ------------------------------------------------------------------ */

interface Composicion {
  recurrente: number
  recurrenteConteo: number
  puntual: number
  puntualConteo: number
  porcentajeRecurrente: number
}

export function FixedVsVariable({ composicion }: { composicion: Composicion }) {
  const t = useChartTheme()
  const { recurrente, puntual, porcentajeRecurrente, recurrenteConteo, puntualConteo } = composicion
  const totalGeneral = recurrente + puntual

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Fijo vs. variable</CardTitle>
        <p className="text-xs text-muted-foreground">
          {totalGeneral > 0
            ? <>El <span className="font-medium text-foreground tabular-nums">{porcentajeRecurrente.toFixed(0)}%</span> de tu gasto está comprometido en recurrentes</>
            : "Sin gastos en este período."}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex h-2 rounded-full overflow-hidden bg-muted">
          <div style={{ width: `${porcentajeRecurrente}%`, background: t.serie[3] }} />
          <div style={{ width: `${100 - porcentajeRecurrente}%`, background: t.serie[1] }} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full" style={{ background: t.serie[3] }} />
              Recurrente
            </span>
            <p className="text-lg font-semibold text-foreground tabular-nums mt-0.5">{formatMoney(recurrente)}</p>
            <p className="text-xs text-muted-foreground">{recurrenteConteo} gastos</p>
          </div>
          <div>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full" style={{ background: t.serie[1] }} />
              Puntual
            </span>
            <p className="text-lg font-semibold text-foreground tabular-nums mt-0.5">{formatMoney(puntual)}</p>
            <p className="text-xs text-muted-foreground">{puntualConteo} gastos</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
