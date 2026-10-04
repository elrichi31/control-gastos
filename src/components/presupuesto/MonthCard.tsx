import { ArrowUpRight, CalendarDays, TrendingDown, TrendingUp, X } from "lucide-react"
import Link from "next/link"
import { formatMoney } from "@/lib/utils"

interface MonthCardProps {
  month: { name: string; value: string; number: number }
  data: {
    total: number
    expenses: number
    status: "completed" | "in-progress" | "pending"
    trend: "up" | "down" | "stable"
    previousMonth: number
    id: number
  }
  isCurrentMonth: boolean
  onRemove: (monthValue: string) => void
}

export function MonthCard({ month, data, isCurrentMonth, onRemove }: MonthCardProps) {
  const hasData = data.expenses > 0
  const actual = isCurrentMonth && data.status === "in-progress"
  const canRemove = !hasData && !actual
  const variacion = hasData && data.previousMonth > 0
    ? Math.round(((data.total - data.previousMonth) / data.previousMonth) * 100)
    : null
  const promedio = hasData ? data.total / data.expenses : 0
  const sube = (variacion ?? 0) > 0

  return (
    <div className="group relative">
      <Link
        href={`/presupuesto/${data.id}?mes=${encodeURIComponent(month.name)}`}
        className={`block rounded-xl border p-4 transition-colors hover:bg-muted/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring ${actual ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
      >
        <div className={`flex flex-wrap items-center justify-between gap-2 mb-4 ${canRemove ? "pr-10" : ""}`}>
          <h3 className="inline-flex items-center gap-2 font-medium text-foreground"><CalendarDays aria-hidden="true" className={`h-4 w-4 ${actual ? "text-primary" : "text-muted-foreground"}`} />{month.name}</h3>
          <span className={`text-[11px] font-medium rounded-full px-2 py-1 ${actual ? "text-primary bg-primary/10" : "text-muted-foreground bg-muted"}`}>
            {actual ? "Actual" : data.status === "completed" ? "Mes anterior" : data.status === "pending" ? "Próximo" : "En curso"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Gasto registrado</p>
        <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums mt-1 break-words">{formatMoney(data.total)}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs text-muted-foreground tabular-nums">
          <span>{hasData ? `${data.expenses} ${data.expenses === 1 ? "gasto" : "gastos"}` : "Sin gastos"}</span>
          {hasData && <span>· {formatMoney(promedio)} promedio</span>}
        </div>
        <div className="mt-4 pt-3 border-t border-border/70 flex flex-wrap items-center justify-between gap-2">
          {variacion !== null ? (
            <span className={`inline-flex items-center gap-1 text-xs ${variacion === 0 ? "text-muted-foreground" : sube ? "text-chart-5" : "text-chart-2"}`}>
              {variacion !== 0 && (sube ? <TrendingUp aria-hidden="true" className="h-3.5 w-3.5" /> : <TrendingDown aria-hidden="true" className="h-3.5 w-3.5" />)}
              <span className="font-medium tabular-nums">{variacion === 0 ? "Sin cambios" : `${Math.abs(variacion)}%`}</span>
              <span className="text-muted-foreground">vs. mes anterior</span>
            </span>
          ) : <span className="text-xs text-muted-foreground">{hasData ? "Sin base de comparación" : "Configura tus categorías"}</span>}
          <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-primary" />
        </div>
      </Link>
      {canRemove && (
        <button type="button" onClick={() => onRemove(month.value)} aria-label={`Quitar ${month.name}`} title={`Quitar ${month.name}`}
          className="absolute top-2 right-2 h-11 w-11 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring transition-colors">
          <X aria-hidden="true" className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
