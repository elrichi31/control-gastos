export function getBudgetIndicator(budget: number, spent: number) {
  const percentage = budget > 0 ? Math.max(0, spent / budget * 100) : 0
  if (budget <= 0) return { label: "Sin presupuesto", tone: "bg-muted text-muted-foreground", bar: "bg-muted-foreground", percentage }
  if (spent > budget) return { label: "Límite excedido", tone: "bg-chart-5/10 text-foreground", bar: "bg-chart-5", percentage }
  if (spent === budget) return { label: "Al límite", tone: "bg-chart-3/10 text-foreground", bar: "bg-chart-3", percentage }
  if (percentage >= 80) return { label: "Cerca del límite", tone: "bg-chart-3/10 text-foreground", bar: "bg-chart-3", percentage }
  return { label: "Dentro del límite", tone: "bg-chart-2/10 text-foreground", bar: "bg-chart-2", percentage }
}

export function BudgetIndicator({ budget, spent, forecastExceeded = false }: { budget: number; spent: number; forecastExceeded?: boolean }) {
  const state = getBudgetIndicator(budget, spent)
  const forecast = forecastExceeded && budget > 0 && spent <= budget
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${forecast ? "bg-chart-5/10 text-foreground" : state.tone}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full shrink-0 ${forecast ? "bg-chart-5" : state.bar}`} />
      {forecast ? "Exceso previsto" : state.label}
    </span>
  )
}
