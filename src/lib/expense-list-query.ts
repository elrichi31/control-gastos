const date = (value: string | null) => {
  if (value === null) return undefined
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value) throw new Error('Fecha inválida')
  return value
}
export function parseExpenseListQuery(params: URLSearchParams) {
  const from = date(params.get('from')), to = date(params.get('to'))
  if (from && to && from > to) throw new Error('Rango inválido')
  const paged = params.has('page') || params.has('limit')
  const integer = (name: string, fallback: number, max: number) => {
    const raw = params.get(name)
    if (raw === null) return fallback
    if (!/^[1-9]\d*$/.test(raw) || Number(raw) > max) throw new Error('Paginación inválida')
    return Number(raw)
  }
  const page = integer('page', 1, 1_000_000), limit = integer('limit', 100, 500)
  return { from, to, paged, page, limit, offset: (page - 1) * limit }
}
