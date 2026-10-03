// Finds manual expenses that look like an untracked subscription: the same
// description charged in at least 3 consecutive months with a stable amount.

export type DetectorExpense = { descripcion: string; monto: number; fecha: string; categoria_id: number; metodo_pago_id?: number | null; is_recurrent?: boolean }
export type SubscriptionSuggestion = { clave: string; descripcion: string; monto: number; dia_mes: number; categoria_id: number; metodo_pago_id: number | null; meses: number }

const MIN_MONTHS = 3
const TOLERANCE = 0.15 // ±15% around the median absorbs taxes and FX, not a different product.

export const normalizeDescription = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

const monthIndex = (fecha: string) => Number(fecha.slice(0, 4)) * 12 + Number(fecha.slice(5, 7)) - 1

export function detectSubscriptions(expenses: DetectorExpense[], existingDescriptions: string[], today: string): SubscriptionSuggestion[] {
  const known = new Set(existingDescriptions.map(normalizeDescription))
  const groups = new Map<string, DetectorExpense[]>()
  for (const e of expenses) {
    const key = normalizeDescription(e.descripcion || '')
    if (e.is_recurrent || !key || known.has(key)) continue
    groups.set(key, [...(groups.get(key) || []), e])
  }
  const current = monthIndex(today)
  const suggestions: SubscriptionSuggestion[] = []
  for (const [clave, items] of groups) {
    // Latest charge per month, newest month first.
    const byMonth = new Map<number, DetectorExpense>()
    for (const e of items) {
      const m = monthIndex(e.fecha)
      const prev = byMonth.get(m)
      if (!prev || e.fecha > prev.fecha) byMonth.set(m, e)
    }
    const months = [...byMonth.keys()].sort((a, b) => b - a)
    // Still alive: charged this month or last month.
    if (months[0] < current - 1) continue
    let run = 1
    while (run < months.length && months[run - 1] - months[run] === 1) run++
    if (run < MIN_MONTHS) continue
    const recent = months.slice(0, run).map(m => byMonth.get(m)!)
    const amounts = recent.map(e => Number(e.monto)).sort((a, b) => a - b)
    const median = amounts[Math.floor(amounts.length / 2)]
    if (amounts.some(a => Math.abs(a - median) > median * TOLERANCE)) continue
    const latest = recent[0]
    suggestions.push({
      clave, descripcion: latest.descripcion.trim(), monto: Number(latest.monto), dia_mes: Number(latest.fecha.slice(8, 10)),
      categoria_id: latest.categoria_id, metodo_pago_id: latest.metodo_pago_id ?? null, meses: run,
    })
  }
  return suggestions.sort((a, b) => b.monto - a.monto)
}
