export type ReviewTab = 'nuevos' | 'duplicados' | 'recibidos'
export const REVIEW_PAGE_SIZE = 50
const TABS: ReviewTab[] = ['nuevos', 'duplicados', 'recibidos']

type Row = { id: number; tipo: 'gasto' | 'ingreso'; descripcion: string; origen: string; fecha: string; coincidencias: unknown[] }

export function parseReviewQuery(url: URL) {
  const tab = TABS.includes(url.searchParams.get('tab') as ReviewTab) ? url.searchParams.get('tab') as ReviewTab : 'nuevos'
  const page = Math.max(1, Math.floor(Number(url.searchParams.get('page'))) || 1)
  const q = (url.searchParams.get('q') ?? '').trim().toLocaleLowerCase('es').slice(0, 200)
  // "Es otro gasto": duplicados que la persona marcó como nuevos en esta sesión.
  const otros = new Set((url.searchParams.get('otros') ?? '').split(',').map(Number).filter(n => Number.isInteger(n) && n > 0))
  return { tab, page, q, otros }
}

const tabOf = (row: Row, otros: Set<number>): ReviewTab =>
  row.tipo === 'ingreso' ? 'recibidos' : row.coincidencias.length && !otros.has(row.id) ? 'duplicados' : 'nuevos'

/** Clasifica todo (barato, en memoria) pero entrega solo una página de la pestaña pedida. */
export function pageReviewRows<T extends Row>(rows: T[], { tab, page, q, otros }: ReturnType<typeof parseReviewQuery>) {
  const counts: Record<ReviewTab, number> = { nuevos: 0, duplicados: 0, recibidos: 0 }
  for (const row of rows) counts[tabOf(row, otros)]++
  let inTab = rows.filter(row => tabOf(row, otros) === tab)
  if (q) inTab = inTab.filter(row => `${row.descripcion} ${row.origen} ${row.fecha}`.toLocaleLowerCase('es').includes(q))
  // Los recién marcados como "otro gasto" primero, para que se vean al cambiar de pestaña.
  if (tab === 'nuevos' && otros.size) inTab = [...inTab.filter(r => otros.has(r.id)), ...inTab.filter(r => !otros.has(r.id))]
  const pages = Math.max(1, Math.ceil(inTab.length / REVIEW_PAGE_SIZE))
  const current = Math.min(page, pages)
  return {
    rows: inTab.slice((current - 1) * REVIEW_PAGE_SIZE, current * REVIEW_PAGE_SIZE),
    counts, total: inTab.length, page: current, pages,
  }
}
