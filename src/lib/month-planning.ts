import type { GastoRecurrente } from '@/types/recurring-expense'

export type PlanningRule = GastoRecurrente & { proxima_fecha?: string | null; ultima_fecha_generada?: string | null }

type Expense = { fecha: string; monto: number; gasto_recurrente_id?: number | null }
type Category = { id: number; nombre: string; presupuestado: number; gastado: number }
export type PlanAlert = { kind: 'near' | 'exceeded' | 'projection' | 'commitments'; category?: string; amount: number }
const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

/** Calendar-date forecasts, not bank balances or proof of payment. Today is
 * already covered by recorded spending; reserve only strictly future dates. */
export function buildMonthPlan({ today, budget, expenses, rules, categories, includeToday = false }: {
  today: string; budget?: number; expenses: Expense[]; rules: PlanningRule[]; categories: Category[]; includeToday?: boolean
}) {
  const [year, month, day] = today.split('-').map(Number)
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const prefix = today.slice(0, 7)
  const monthExpenses = expenses.filter(e => e.fecha.slice(0, 7) === prefix)
  const spent = money(monthExpenses.reduce((sum, e) => sum + Number(e.monto), 0))
  const recorded = new Set(monthExpenses.filter(e => e.gasto_recurrente_id != null).map(e => `${e.gasto_recurrente_id}:${e.fecha.slice(0, 10)}`))
  const upcoming: { ruleId: number; description: string; date: string; amount: number }[] = []
  for (let d = day + (includeToday ? 0 : 1); d <= days; d++) {
    const date = `${prefix}-${String(d).padStart(2, '0')}`
    const weekDay = new Date(Date.UTC(year, month - 1, d)).getUTCDay() || 7
    for (const rule of rules) {
      if (!rule.activo || date < rule.fecha_inicio || (rule.fecha_fin && date > rule.fecha_fin)) continue
      if ((rule.proxima_fecha && date < rule.proxima_fecha) || (rule.ultima_fecha_generada && date <= rule.ultima_fecha_generada)) continue
      // Same calendar as SQL recurring_next_date: days 29-31 clamp to the month's last day.
      const monthDay = Math.min(Number(rule.dia_mes), days)
      const matches = rule.frecuencia === 'semanal' ? weekDay === Number(rule.dia_semana)
        : rule.frecuencia === 'anual' ? month === Number(rule.mes_anual) && d === monthDay
        : d === monthDay
      if (matches && !recorded.has(`${rule.id}:${date}`)) upcoming.push({ ruleId: rule.id, description: rule.descripcion, date, amount: Number(rule.monto) })
    }
  }
  const committed = money(upcoming.reduce((sum, e) => sum + e.amount, 0))
  const remaining = budget == null ? null : money(Number(budget) - spent)
  const available = remaining === null ? null : money(remaining - committed)
  const daysLeft = days - day + 1
  // Future-dated recorded entries are not extrapolated as spending already elapsed.
  const elapsedSpent = monthExpenses.filter(e => e.fecha.slice(0, 10) <= today).reduce((sum, e) => sum + Number(e.monto), 0)
  const projected = money(elapsedSpent / day * days)
  const alerts: PlanAlert[] = []
  for (const cat of categories) {
    if (cat.gastado > cat.presupuestado) alerts.push({ kind: 'exceeded', category: cat.nombre, amount: money(cat.gastado - cat.presupuestado) })
    else if (cat.presupuestado > 0 && cat.gastado >= cat.presupuestado * 0.8) alerts.push({ kind: 'near', category: cat.nombre, amount: money(cat.presupuestado - cat.gastado) })
  }
  if (budget != null && projected > budget) alerts.push({ kind: 'projection', amount: money(projected - budget) })
  if (available !== null && available < 0) alerts.push({ kind: 'commitments', amount: -available })
  return { spent, remaining, committed, available, daysLeft, daily: available === null ? null : money(Math.max(0, available) / daysLeft), upcoming, alerts }
}
export type MonthPlan = ReturnType<typeof buildMonthPlan>

type BudgetCategoryInput = { categoria_id: number; categoria: { nombre: string; icono?: string }; movimientos?: { monto: number | string }[] }

/** Presupuestado (suma de los movimientos de la categoría) contra gastado en el mes `monthKey` (YYYY-MM). */
export function categoryUsage(budgetCategories: readonly BudgetCategoryInput[], gastos: readonly { categoria_id: number; monto: number; fecha: string }[], monthKey: string) {
  const spent: Record<number, number> = {}
  for (const g of gastos) if (g.fecha.slice(0, 7) === monthKey) spent[g.categoria_id] = (spent[g.categoria_id] || 0) + g.monto
  return budgetCategories.map(cat => ({
    categoria_id: cat.categoria_id,
    nombre: cat.categoria.nombre,
    icono: cat.categoria.icono,
    presupuestado: cat.movimientos?.reduce((sum, mov) => sum + (typeof mov.monto === 'string' ? parseFloat(mov.monto) : mov.monto || 0), 0) || 0,
    gastado: spent[cat.categoria_id] || 0,
  }))
}

/** Solo avisa al cruzar el umbral (80% o 100%), no en cada gasto posterior. */
export function budgetCrossing(before: number, after: number, presupuestado: number): 'exceeded' | 'near' | null {
  const [b, a, p] = [money(before), money(after), money(presupuestado)]
  if (b <= p && a > p) return 'exceeded'
  if (p > 0 && b < p * 0.8 && a >= p * 0.8 && a <= p) return 'near'
  return null
}
