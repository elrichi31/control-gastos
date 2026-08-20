"use client"

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

interface StatTileProps {
  etiqueta: string
  valor: string
  /** Variación % contra el período anterior. null = sin base de comparación. */
  delta?: number | null
  /** En gastos, subir es malo: invierte el color del delta. */
  invertirColor?: boolean
  ayuda?: string
}

export function StatTile({ etiqueta, valor, delta, invertirColor = true, ayuda }: StatTileProps) {
  const sinDato = delta === null || delta === undefined
  const plano = !sinDato && Math.abs(delta!) < 1
  const sube = !sinDato && delta! > 0

  // Para gastos: subir = rojo, bajar = verde. Para conteos neutros se puede invertir.
  const color = plano
    ? "text-muted-foreground"
    : sube === invertirColor
      ? "text-chart-5"
      : "text-chart-2"

  const Icono = plano ? Minus : sube ? ArrowUpRight : ArrowDownRight

  return (
    <div className="px-5 py-4">
      <p className="text-xs font-medium text-muted-foreground">{etiqueta}</p>
      <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums mt-1">{valor}</p>
      <div className="flex items-center gap-1 mt-1.5 h-4">
        {sinDato ? (
          <span className="text-xs text-muted-foreground">{ayuda ?? "sin período previo"}</span>
        ) : (
          <>
            <Icono className={`w-3.5 h-3.5 ${color}`} />
            <span className={`text-xs font-medium tabular-nums ${color}`}>
              {Math.abs(delta!).toFixed(0)}%
            </span>
            <span className="text-xs text-muted-foreground">vs. período anterior</span>
          </>
        )}
      </div>
    </div>
  )
}

export function StatTileRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border rounded-xl border border-border bg-card overflow-hidden">
      {children}
    </div>
  )
}
