"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney } from "@/lib/utils"
import { TrendingDown, TrendingUp } from "lucide-react"

interface Proyeccion {
  proyectado: number
  ritmoDiario: number
  diasTranscurridos: number
  diasTotales: number
  totalPrevio: number
  deltaVsPrevio: number | null
}

/**
 * Proyecta el cierre del mes a partir del ritmo diario observado.
 * Es la métrica más accionable de la página: responde "si sigo así, ¿en cuánto
 * termino?" mientras todavía se puede corregir el rumbo.
 */
export function ProjectionCard({ proyeccion }: { proyeccion: Proyeccion }) {
  const { proyectado, ritmoDiario, diasTranscurridos, diasTotales, totalPrevio, deltaVsPrevio } = proyeccion
  const avance = (diasTranscurridos / diasTotales) * 100
  const superara = deltaVsPrevio !== null && deltaVsPrevio > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Proyección de cierre</CardTitle>
        <p className="text-xs text-muted-foreground">
          Día {diasTranscurridos} de {diasTotales} · ritmo de{" "}
          <span className="font-medium text-foreground tabular-nums">{formatMoney(ritmoDiario)}</span> al día
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Cerrarías el mes en</p>
            <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums mt-0.5">
              {formatMoney(proyectado)}
            </p>
          </div>
          {totalPrevio > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Mes anterior</p>
              <p className="text-xl font-medium text-muted-foreground tabular-nums mt-0.5">
                {formatMoney(totalPrevio)}
              </p>
            </div>
          )}
          {deltaVsPrevio !== null && Math.abs(deltaVsPrevio) >= 1 && (
            <div
              className={`flex items-center gap-1.5 text-sm font-medium ${
                superara ? "text-chart-5" : "text-chart-2"
              }`}
            >
              {superara ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="tabular-nums">{Math.abs(deltaVsPrevio).toFixed(0)}%</span>
              <span className="text-muted-foreground font-normal">
                {superara ? "por encima del mes pasado" : "por debajo del mes pasado"}
              </span>
            </div>
          )}
        </div>

        {/* Avance del mes: cuánto del período ya transcurrió */}
        <div className="mt-5">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${avance}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
            {avance.toFixed(0)}% del mes transcurrido
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
