import { normalizeName } from '@/lib/bank-emails'
import { computeForeignTax, foreignTaxFromStored, parseStoredForeignTax } from '@/lib/foreign-tax'
import type { PlanningRule } from '@/lib/month-planning'

// Coincidencias entre lo detectado en el correo y los gastos que ya existen.
export type RecurringMatch = { id: number; fecha: string; esperado: number; cobrado: number; diferencia: number; total: number; impuestos: boolean }

/** Match conservador por nombre completo y calendario (±3 días), nunca solo por precio.
 * Las coincidencias son sugerencias: solamente la confirmación explícita escribe datos. */
export function findRecurringCandidates(row: PendingMovement & { descripcion: string; descripcion_original?: string }, rules: PlanningRule[], expenses: (ExistingExpense & { gasto_recurrente_id?: number | null })[]): Candidate[] {
  if (row.tipo !== 'gasto') return []
  const names = [row.descripcion, row.descripcion_original ?? ''].map(normalizeName)
  const result: Candidate[] = []
  for (const rule of rules) {
    const name = normalizeName(rule.descripcion)
    if (name.length < 4 || !names.some(n => ` ${n} `.includes(` ${name} `))) continue
    for (let offset = -3; offset <= 3; offset++) {
      const date = new Date(Date.parse(row.fecha) + offset * DAY)
      const fecha = date.toISOString().slice(0, 10)
      if (fecha < rule.fecha_inicio || (rule.fecha_fin && fecha > rule.fecha_fin)) continue
      if (!scheduledOn(rule, date)) continue
      const expense = expenses.find(e => e.gasto_recurrente_id === rule.id && e.fecha === fecha)
      // Una fecha omitida/consumida o anterior al cursor no se vuelve a crear.
      if (!expense && (!rule.activo || !rule.proxima_fecha || fecha < rule.proxima_fecha || (rule.ultima_fecha_generada && fecha <= rule.ultima_fecha_generada))) continue
      const tax = parseStoredForeignTax(rule.impuesto_exterior)
      const expected = tax?.base ?? Number(rule.monto)
      result.push({ gasto: expense ?? { id: -rule.id, descripcion: rule.descripcion, monto: Number(rule.monto), fecha }, kind: 'otro', dias: Math.abs(offset),
        recurrente: { id: rule.id, fecha, esperado: expected, cobrado: row.monto, diferencia: Math.round((row.monto - expected) * 100) / 100, total: computeForeignTax(row.monto, foreignTaxFromStored(tax)).total, impuestos: !!tax } })
    }
  }
  return result.sort((a, b) => a.dias - b.dias)
}
export type RecurringEmailStatus = { estado: 'confirmado' | 'sin_confirmar' | 'sin_vencimientos'; fecha: string | null; fecha_correo?: string; monto?: number }
export type RecurringEmailEvidence = { recurrente_id: number | null; fecha_programada: string | null; fecha: string; monto: number }

function scheduledOn(rule: PlanningRule, date: Date) {
  const month = date.getUTCMonth() + 1
  const last = new Date(Date.UTC(date.getUTCFullYear(), month, 0)).getUTCDate()
  return rule.frecuencia === 'semanal' ? (date.getUTCDay() || 7) === Number(rule.dia_semana)
    : date.getUTCDate() === Math.min(Number(rule.dia_mes), last) && (rule.frecuencia !== 'anual' || month === Number(rule.mes_anual))
}

/** Último vencimiento del calendario; la ausencia de evidencia NO demuestra impago. */
export function recurringEmailStatus(rule: PlanningRule, evidence: RecurringEmailEvidence[], today: string): RecurringEmailStatus {
  const end = rule.fecha_fin && rule.fecha_fin < today ? rule.fecha_fin : today
  for (let offset = 0; offset <= 366; offset++) {
    const date = new Date(Date.parse(end) - offset * DAY)
    const fecha = date.toISOString().slice(0, 10)
    if (fecha < rule.fecha_inicio) break
    if (!scheduledOn(rule, date)) continue
    const mail = evidence.find(c => c.recurrente_id === rule.id && c.fecha_programada === fecha)
    return mail ? { estado: 'confirmado', fecha, fecha_correo: mail.fecha, monto: Number(mail.monto) } : { estado: 'sin_confirmar', fecha }
  }
  return { estado: 'sin_vencimientos', fecha: null }
}

export type ExistingExpense = { id: number; descripcion: string; monto: number; fecha: string; categoria?: { nombre: string } | null }
export type PendingMovement = { tipo: 'gasto' | 'ingreso'; fecha: string; monto: number }
/** igual: mismo monto. mitad: un gasto registró la mitad (gasto compartido). */
export type Candidate = {
  recurrente?: RecurringMatch
  gasto: ExistingExpense; kind: 'igual' | 'mitad' | 'otro'; dias: number
  /** De Jev, si estuvo disponible. */
  veredicto?: 'encaja' | 'desconocido' | 'no_encaja'; probabilidad?: number
}

const DAY = 86_400_000
const dayDiff = (a: string, b: string) => Math.round((Date.parse(a) - Date.parse(b)) / DAY)
const same = (a: number, b: number) => Math.abs(a - b) < 0.005

/**
 * gasto: gastos de ±2 días con el mismo monto o con la mitad (lo registraste ya dividido).
 * ingreso: gastos de hasta 20 días antes de los que descontar lo recibido; primero los que
 * valen el doble (te devolvieron justo la mitad). Nunca un gasto que quedaría en cero o negativo.
 */
export function findCandidates(row: PendingMovement, gastos: ExistingExpense[]): Candidate[] {
  const rank = { igual: 0, mitad: 1, otro: 2 }
  if (row.tipo === 'ingreso') {
    return gastos
      .map(gasto => ({ gasto, dias: dayDiff(row.fecha, gasto.fecha) }))
      .filter(({ gasto, dias }) => dias >= -1 && dias <= 20 && gasto.monto > row.monto + 0.005)
      .map(({ gasto, dias }) => ({ gasto, dias: Math.abs(dias), kind: same(gasto.monto, row.monto * 2) ? 'mitad' as const : 'otro' as const }))
      .sort((a, b) => rank[a.kind] - rank[b.kind] || a.dias - b.dias)
      .slice(0, 5)
  }
  return gastos
    .map(gasto => ({ gasto, dias: Math.abs(dayDiff(row.fecha, gasto.fecha)) }))
    .filter(({ dias }) => dias <= 2)
    .flatMap(({ gasto, dias }): Candidate[] => same(gasto.monto, row.monto) ? [{ gasto, dias, kind: 'igual' }]
      : same(gasto.monto, row.monto / 2) ? [{ gasto, dias, kind: 'mitad' }] : [])
    .sort((a, b) => rank[a.kind] - rank[b.kind] || a.dias - b.dias)
    .slice(0, 3)
}
