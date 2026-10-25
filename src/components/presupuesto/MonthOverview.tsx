"use client"

import { CalendarDays, Receipt, Target, Wallet, type LucideIcon } from "lucide-react"
import { formatMoney } from "@/lib/utils"
import { BudgetIndicator, getBudgetIndicator } from "./BudgetIndicator"

const STROKE: Record<string, string> = { "bg-chart-2": "stroke-chart-2", "bg-chart-3": "stroke-chart-3", "bg-chart-5": "stroke-chart-5", "bg-muted-foreground": "stroke-muted-foreground" }
const TEXT: Record<string, string> = { "bg-chart-2": "text-chart-2", "bg-chart-3": "text-chart-3", "bg-chart-5": "text-chart-5", "bg-muted-foreground": "text-foreground" }

/** Cuántos días lleva el mes y cuántos faltan, según el mes que se está viendo y la fecha de hoy. */
export function monthProgress(mes: number, anio: number, now = new Date()) {
  const days = new Date(anio, mes, 0).getDate()
  const current = now.getFullYear() === anio && now.getMonth() + 1 === mes
  const past = anio < now.getFullYear() || (anio === now.getFullYear() && mes < now.getMonth() + 1)
  return { days, current, elapsed: current ? now.getDate() : past ? days : 0, left: current ? days - now.getDate() : past ? 0 : days }
}

function Ring({ percent, bar }: { percent: number; bar: string }) {
  const value = Math.max(0, Math.min(100, percent)), radius = 48, circumference = 2 * Math.PI * radius
  return (
    <div role="img" aria-label={`${Math.round(percent)}% del presupuesto consumido`} className="relative size-28 shrink-0 sm:size-32">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="11" className="stroke-muted" />
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="11" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / 100)} className={`${STROKE[bar] ?? "stroke-chart-2"} transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none`} />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <p className="text-2xl font-semibold tabular-nums">{Math.round(percent)}%</p>
        <p className="text-[11px] text-muted-foreground">consumido</p>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-4" /></span>
      <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="truncate text-lg font-semibold tabular-nums">{value}</p></div>
    </div>
  )
}

/** Lectura principal del mes: cuánto queda, cuánto se consumió y cómo se repartió el gasto por día. */
export function MonthOverview({ presupuestado, gastado, mes, anio, gastos }: { presupuestado: number; gastado: number; mes: number; anio: number; gastos: readonly { fecha: string; monto: number }[] }) {
  const { days, current, elapsed, left } = monthProgress(mes, anio)
  const remaining = presupuestado - gastado
  const state = getBudgetIndicator(presupuestado, gastado)
  const key = `${anio}-${String(mes).padStart(2, "0")}`
  const daily = Array.from({ length: days }, () => 0)
  for (const gasto of gastos) if (gasto.fecha.slice(0, 7) === key) daily[Number(gasto.fecha.slice(8, 10)) - 1] += gasto.monto
  const peak = Math.max(...daily, 0)
  const average = elapsed > 0 ? gastado / elapsed : 0
  const noBudget = presupuestado <= 0
  const labels = [...new Set([1, 8, 15, 22, days])].filter(day => day <= days)

  return (
    <section aria-label="Resumen del mes" className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Wallet aria-hidden="true" className="size-4" />{remaining < 0 ? "Te pasaste por" : "Te queda disponible"}</span>
            <BudgetIndicator budget={presupuestado} spent={gastado} />
          </div>
          <p className={`mt-3 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl ${noBudget ? "text-foreground" : TEXT[state.bar]}`}>{formatMoney(noBudget ? 0 : Math.abs(remaining))}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {noBudget ? "Todavía no asignaste montos presupuestados a las categorías de este mes."
              : remaining < 0 ? "Ya superaste el presupuesto de este mes."
              : left > 0 ? <>Puedes gastar unos <span className="font-semibold text-foreground tabular-nums">{formatMoney(remaining / left)} por día</span> hasta fin de mes.</>
              : "Este mes ya cerró."}
          </p>
        </div>
        {!noBudget && <Ring percent={state.percentage} bar={state.bar} />}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={Target} label="Presupuestado" value={formatMoney(presupuestado)} />
        <Stat icon={Receipt} label="Gastado" value={formatMoney(gastado)} />
        <Stat icon={CalendarDays} label="Promedio diario" value={formatMoney(average)} />
      </div>

      <div>
        <p className="mb-2 text-xs text-muted-foreground">Gasto por día</p>
        <div role="img" aria-label={`Gasto por día en ${key}: ${formatMoney(gastado)} en total`} className="flex h-24 items-end gap-[3px]">
          {daily.map((amount, index) => {
            const day = index + 1
            return <div key={day} title={`Día ${day} · ${formatMoney(amount)}`} style={{ height: amount > 0 ? `${Math.max(8, (amount / peak) * 100)}%` : "2px" }}
              className={`flex-1 rounded-sm ${current && day === elapsed ? "bg-chart-2" : day > elapsed ? "bg-muted" : "bg-muted-foreground/25"}`} />
          })}
        </div>
        <div aria-hidden="true" className="mt-1.5 flex justify-between text-[10px] text-muted-foreground tabular-nums">{labels.map(day => <span key={day}>{day}</span>)}</div>
      </div>
    </section>
  )
}
