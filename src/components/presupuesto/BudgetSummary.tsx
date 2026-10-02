"use client"

import { formatMoney } from "@/lib/utils"
import { Wallet } from "lucide-react"
import { BudgetIndicator, getBudgetIndicator } from "./BudgetIndicator"

interface Props {
  presupuestado: number
  gastado: number
  planning?: { committed: number; available: number; daily: number; daysLeft: number }
}

/**
 * Cabecera del mes. Reemplaza las tres tarjetas centradas de colores por una
 * sola lectura: cuánto va consumido del presupuesto y cuánto queda.
 */
export function BudgetSummary({ presupuestado, gastado, planning }: Props) {
  const diferencia = presupuestado - gastado
  const disponible = planning?.available ?? diferencia
  const disponibleExcedido = disponible < 0
  const excedido = diferencia < 0
  const porcentaje = presupuestado > 0 ? (gastado / presupuestado) * 100 : 0
  const sinPresupuesto = presupuestado <= 0

  const colorBarra = getBudgetIndicator(presupuestado, gastado).bar

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <span className="inline-flex items-center gap-2 text-sm font-medium"><Wallet aria-hidden="true" className="h-4 w-4 text-primary" /> Estado del mes</span>
        <BudgetIndicator budget={presupuestado} spent={gastado} forecastExceeded={disponibleExcedido} />
      </div>
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Presupuestado</p>
          <p className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground tabular-nums mt-1">
            {formatMoney(presupuestado)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Gastado</p>
          <p className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground tabular-nums mt-1">
            {formatMoney(gastado)}
          </p>
        </div>
        {!sinPresupuesto && <div className={`min-[360px]:col-span-2 sm:col-span-1 rounded-lg p-3 -m-3 ${disponibleExcedido ? "bg-chart-5/5" : "bg-primary/5"}`}>
          <p className="text-xs font-medium text-muted-foreground">
            {planning ? (disponibleExcedido ? "Exceso previsto" : "Disponible para gastar") : (excedido ? "Excedido" : "Disponible")}
          </p>
          <p
            className={`text-xl sm:text-2xl font-semibold tracking-tight tabular-nums mt-1 ${
              disponibleExcedido ? "text-chart-5" : "text-primary"
            }`}
          >
            {formatMoney(Math.abs(disponible))}
          </p>
        </div>}
      </div>

      {!sinPresupuesto && (
        <div className="mt-5">
          <div role="progressbar" aria-label="Consumo del presupuesto" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0, Math.min(100, porcentaje))} aria-valuetext={`${porcentaje.toFixed(0)}% del presupuesto consumido`} className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${colorBarra}`}
              style={{ width: `${Math.max(0, Math.min(100, porcentaje))}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 tabular-nums">
            {porcentaje.toFixed(0)}% del presupuesto consumido
            {excedido && <span className="text-chart-5"> · por encima del límite</span>}
          </p>
        </div>
      )}

      {planning && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-4">
            <div><p className="text-xs text-muted-foreground">Recurrentes por reservar</p><p className="mt-1 text-sm font-medium tabular-nums">{formatMoney(planning.committed)}</p></div>
            <div><p className="text-xs text-muted-foreground">Guía diaria · orientativa</p><p className="mt-1 text-sm font-medium tabular-nums">{formatMoney(planning.daily)} <span className="font-normal text-muted-foreground">/ día</span></p><p className="mt-1 text-xs text-muted-foreground">{planning.daysLeft} días, incluyendo hoy</p></div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Disponible tras reservar recurrentes de mañana a fin de mes. No es saldo bancario.</p>
        </div>
      )}

      {sinPresupuesto && (
        <p className="text-xs text-muted-foreground mt-4">
          Todavía no asignaste montos presupuestados a las categorías de este mes.
        </p>
      )}
    </div>
  )
}
