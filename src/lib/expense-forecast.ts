import { buildMonthPlan, type PlanningRule } from './month-planning'

export type ForecastExpense = { fecha: string; monto: number; is_recurrent?: boolean; gasto_recurrente_id?: number | null }
export type ForecastInput = { today: string; expenses: ForecastExpense[]; rules: PlanningRule[] }
export type ForecastMethod = 'pace' | 'weekday' | 'blend'
const METHODS: ForecastMethod[] = ['pace', 'weekday', 'blend']
export const FORECAST_METHOD_LABELS: Record<ForecastMethod, string> = { pace: 'Ritmo del mes', weekday: 'Patrón semanal', blend: 'Ritmo + historial' }
const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
const sum = (rows: ForecastExpense[]) => rows.reduce((s, e) => s + Number(e.monto), 0)
const dateAt = (month: string, day: number) => `${month}-${String(day).padStart(2, '0')}`
const daysIn = (month: string) => { const [y, m] = month.split('-').map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate() }
const weekday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay()
const variable = (e: ForecastExpense) => !e.is_recurrent && e.gasto_recurrente_id == null

export function isForecastDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const parsed = new Date(`${date}T12:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
}

/** Candidate models use only completed days and earlier calendar months. */
function dailyModels(month: string, cutoff: number, expenses: ForecastExpense[], eligibleMonths: string[]) {
  const current = expenses.filter(e => e.fecha.startsWith(month) && variable(e) && Number(e.fecha.slice(8, 10)) <= cutoff)
  const firstRecorded = expenses.map(e => e.fecha.slice(0, 10)).sort()[0]
  const pace = cutoff >= 7 && firstRecorded && firstRecorded <= `${month}-01` ? sum(current) / cutoff : null
  const trainingMonths = eligibleMonths.filter(m => m < month).slice(-3)
  const totals = Array(7).fill(0) as number[]
  const counts = Array(7).fill(0) as number[]
  for (const m of trainingMonths) {
    for (let d = 1; d <= daysIn(m); d++) counts[weekday(dateAt(m, d))]++
    for (const e of expenses) if (e.fecha.startsWith(m) && variable(e)) totals[weekday(e.fecha)] += Number(e.monto)
  }
  const historic = trainingMonths.length >= 2 ? totals.map((s, i) => s / counts[i]) : null
  const rates: Record<ForecastMethod, ((date: string) => number) | null> = {
    pace: pace == null ? null : () => pace,
    weekday: historic ? date => historic[weekday(date)] : null,
    blend: historic && pace != null ? date => (pace + historic[weekday(date)]) / 2 : null,
  }
  return { rates, trainingMonths }
}

/** Forecasts the current calendar month. Historical error is not promised accuracy. */
export function buildExpenseForecast({ today, expenses, rules }: ForecastInput) {
  if (!isForecastDate(today)) throw new Error('Fecha de proyección inválida')
  if (expenses.some(e => !isForecastDate(e.fecha.slice(0, 10)) || !Number.isFinite(Number(e.monto)) || Number(e.monto) < 0)
      || rules.some(r => !Number.isFinite(Number(r.monto)) || Number(r.monto) < 0)) throw new Error('Datos de monto o fecha incompletos')
  expenses = expenses.map(e => ({ ...e, fecha: e.fecha.slice(0, 10), monto: Number(e.monto) }))
  const month = today.slice(0, 7), day = Number(today.slice(8, 10)), days = daysIn(month)
  const past = expenses.filter(e => e.fecha.slice(0, 7) < month)
  const earliest = expenses.map(e => e.fecha.slice(0, 10)).sort()[0]
  // The first month may start mid-month. Empty months are unknown, never zero-filled.
  const eligibleMonths = [...new Set(past.map(e => e.fecha.slice(0, 7)))].sort()
    .filter(m => m !== earliest?.slice(0, 7) || earliest === `${m}-01`)
  const backtest: { month: string; actual: number; trainingMonths: string[]; predictions: Record<ForecastMethod, number> }[] = []
  // Rolling origins: a test month's later spending never enters its own prediction.
  for (const m of eligibleMonths.slice(-6)) {
    const cutoff = Math.min(day - 1, daysIn(m) - 1)
    const model = dailyModels(m, cutoff, expenses, eligibleMonths)
    if (!METHODS.every(method => model.rates[method])) continue
    const observed = sum(expenses.filter(e => e.fecha.startsWith(m) && variable(e) && Number(e.fecha.slice(8, 10)) <= cutoff))
    const predictions = {} as Record<ForecastMethod, number>
    for (const method of METHODS) {
      let predicted = observed
      for (let d = cutoff + 1; d <= daysIn(m); d++) predicted += model.rates[method]!(dateAt(m, d))
      predictions[method] = money(predicted)
    }
    backtest.push({ month: m, actual: money(sum(expenses.filter(e => e.fecha.startsWith(m) && variable(e)))), trainingMonths: model.trainingMonths, predictions })
  }
  const model = dailyModels(month, day - 1, expenses, eligibleMonths)
  const current = expenses.filter(e => e.fecha.slice(0, 7) === month), variables = current.filter(variable)
  const recorded = money(sum(current))
  const recordedToDate = money(sum(current.filter(e => e.fecha.slice(0, 10) <= today)))
  const futureRecorded = money(recorded - recordedToDate)
  const plan = buildMonthPlan({ today, expenses, rules, categories: [], includeToday: true })
  const remainingFor = (rate: (date: string) => number) => {
    let remaining = 0
    for (let d = day; d <= days; d++) {
      const date = dateAt(month, d), booked = sum(variables.filter(e => e.fecha.slice(0, 10) === date))
      remaining += Math.max(0, rate(date) - booked)
    }
    return money(remaining)
  }
  const models = METHODS.filter(method => model.rates[method]).map(method => {
    const errors = backtest.map(b => b.predictions[method] - b.actual)
    const absolute = errors.reduce((s, e) => s + Math.abs(e), 0), actual = backtest.reduce((s, b) => s + b.actual, 0)
    return { method, label: FORECAST_METHOD_LABELS[method], projected: money(recorded + plan.committed + remainingFor(model.rates[method]!)),
      mae: backtest.length ? money(absolute / backtest.length) : null,
      wape: backtest.length && actual > 0 ? absolute / actual * 100 : null, errors }
  })
  const validated = backtest.length >= 3
  const chosen = validated ? [...models].sort((a, b) => a.mae! - b.mae!)[0]
    : models.find(m => m.method === 'blend') ?? models.find(m => m.method === 'weekday') ?? models[0]
  const variableRemaining = chosen ? remainingFor(model.rates[chosen.method]!) : null, projected = chosen?.projected ?? null
  const floor = money(recorded + plan.committed)
  // Observed deviations, not a 90/95% probabilistic interval.
  const range = validated && chosen ? { low: money(Math.max(floor, projected! - Math.max(0, ...chosen.errors))), high: money(Math.max(projected!, projected! - Math.min(0, ...chosen.errors))) } : null
  let accumulated = 0, expected = 0
  const points = Array.from({ length: days }, (_, i) => {
    const date = dateAt(month, i + 1), booked = sum(current.filter(e => e.fecha.slice(0, 10) === date))
    accumulated += booked
    if (i + 1 < day) expected = accumulated
    else {
      const planned = plan.upcoming.filter(e => e.date === date).reduce((s, e) => s + e.amount, 0)
      const extraVariable = chosen ? Math.max(0, model.rates[chosen.method]!(date) - sum(variables.filter(e => e.fecha.slice(0, 10) === date))) : 0
      expected += booked + planned + extraVariable
    }
    return { day: i + 1, date, actual: i + 1 <= day ? money(accumulated) : null, forecast: chosen && i + 1 >= day ? money(expected) : null }
  })
  const warnings = [
    'Solo considera gastos registrados: correos pendientes, efectivo sin registrar y cambios futuros pueden alterar el cierre.',
    'El historial no permite comprobar si un día sin gastos fue realmente cero o faltó registrar movimientos.',
    'Recurrentes vencidos sin registrar y pagos fijos no marcados como recurrentes no se identifican automáticamente.',
  ]
  if (day <= 7) warnings.push('El mes acaba de empezar; el ritmo de pocos días es muy sensible a compras puntuales.')
  return { today, month, days, recorded, recordedToDate, futureRecorded, committed: plan.committed, variableRemaining, projected, floor, range,
    method: chosen?.method ?? null, methodLabel: chosen?.label ?? null, errorTypical: chosen?.mae ?? null,
    status: (validated ? 'validated' : chosen ? 'initial' : 'insufficient') as 'validated' | 'initial' | 'insufficient',
    trainingMonths: model.trainingMonths, backtest, models, points, upcoming: plan.upcoming, warnings }
}
export type ExpenseForecast = ReturnType<typeof buildExpenseForecast>
