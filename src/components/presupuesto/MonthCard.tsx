import { TrendingDown, TrendingUp, X } from "lucide-react"
import Link from "next/link"
import { formatMoney } from "@/lib/utils"

interface MonthCardProps {
  month: {
    name: string
    value: string
    number: number
  }
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
  const variacion =
    data.previousMonth > 0
      ? Math.round(((data.total - data.previousMonth) / data.previousMonth) * 100)
      : null
  const promedio = data.expenses > 0 ? data.total / data.expenses : 0
  const sube = (variacion ?? 0) > 0

  return (
    <div className="group relative">
      {/* La tarjeta entera es el enlace: no hace falta un botón "ver detalles" */}
      <Link
        href={`/presupuesto/${data.id}?mes=${encodeURIComponent(month.name)}`}
        className={`block rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          isCurrentMonth ? "border-primary/50" : "border-border"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-medium text-foreground">{month.name}</h3>
          {isCurrentMonth && (
            <span className="text-[11px] font-medium text-primary bg-primary/10 border border-primary/25 rounded-full px-2 py-0.5 shrink-0">
              Actual
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {formatMoney(data.total)}
          </span>
          {variacion !== null && Math.abs(variacion) >= 1 && (
            <span
              className={`flex items-center gap-0.5 text-xs font-medium tabular-nums ${
                sube ? "text-chart-5" : "text-chart-2"
              }`}
            >
              {sube ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(variacion)}%
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-2 tabular-nums">
          {data.expenses} {data.expenses === 1 ? "gasto" : "gastos"}
          {hasData && <> · {formatMoney(promedio)} promedio</>}
        </p>
      </Link>

      {/* Solo se puede quitar un mes vacío; el botón aparece al pasar el mouse */}
      {!hasData && !isCurrentMonth && (
        <button
          onClick={() => onRemove(month.value)}
          title={`Quitar ${month.name}`}
          className="absolute top-3 right-3 h-6 w-6 grid place-items-center rounded-md text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 hover:text-destructive hover:bg-muted transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
