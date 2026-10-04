// Coincidencias entre lo detectado en el correo y los gastos que ya existen.
export type ExistingExpense = { id: number; descripcion: string; monto: number; fecha: string; categoria?: { nombre: string } | null }
export type PendingMovement = { tipo: 'gasto' | 'ingreso'; fecha: string; monto: number }
/** igual: mismo monto. mitad: un gasto registró la mitad (gasto compartido). */
export type Candidate = {
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
