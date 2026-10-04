export interface FilterOptions {
  search: string
  category: string
  paymentMethod: string
  origin: '' | 'manual' | 'email'
  dateRange: 'current-month' | 'year' | 'all-time' | 'custom'
  year: string
  dateFrom: string
  dateTo: string
  minAmount: string
  maxAmount: string
  sortBy: 'date' | 'amount' | 'category' | 'description'
  sortOrder: 'asc' | 'desc'
  groupBy: 'none' | 'day' | 'week' | 'month'
}

export const initialFilters: FilterOptions = {
  search: '', category: '', paymentMethod: '', origin: '', dateRange: 'current-month', year: '',
  dateFrom: '', dateTo: '', minAmount: '', maxAmount: '', sortBy: 'date', sortOrder: 'desc', groupBy: 'none',
}

export function normalizeExpenseFilters(value: unknown): FilterOptions {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const result = { ...initialFilters }
  if (typeof input.search === 'string') result.search = input.search.slice(0, 200)
  for (const key of ['category', 'paymentMethod'] as const) {
    if (typeof input[key] === 'string' && /^[1-9]\d*$/.test(input[key])) result[key] = input[key]
  }
  for (const key of ['minAmount', 'maxAmount'] as const) {
    const amount = input[key]
    if (typeof amount === 'string' && amount.trim() && Number.isFinite(Number(amount)) && Number(amount) >= 0) result[key] = amount
  }
  if (typeof input.year === 'string' && /^[1-9]\d{3}$/.test(input.year)) result.year = input.year
  for (const key of ['dateFrom', 'dateTo'] as const) {
    const value = input[key]
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) continue
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) result[key] = value
  }
  const choices = {
    origin: ['manual', 'email'], dateRange: ['current-month', 'year', 'all-time', 'custom'], sortBy: ['date', 'amount', 'category', 'description'],
    sortOrder: ['asc', 'desc'], groupBy: ['none', 'day', 'week', 'month'],
  }
  for (const key of Object.keys(choices) as (keyof typeof choices)[]) {
    if (typeof input[key] === 'string' && choices[key].includes(input[key])) Object.assign(result, { [key]: input[key] })
  }
  return result
}

/** Count applied criteria, not dormant date fields or presentation preferences. */
export function countActiveExpenseFilters(filters: FilterOptions) {
  return ['search', 'category', 'paymentMethod', 'origin', 'minAmount', 'maxAmount'].filter(key => Boolean(filters[key as keyof FilterOptions])).length
    + (filters.dateRange === 'current-month' ? 0 : 1)
}

const storageKey = (userId: string) => `bethaspend:expense-filters:v1:${userId}`
export function readExpenseFilters(storage: Pick<Storage, 'getItem'>, userId?: string): FilterOptions {
  if (!userId) return { ...initialFilters }
  try {
    const saved = JSON.parse(storage.getItem(storageKey(userId)) || 'null')
    return saved?.version === 1 ? normalizeExpenseFilters(saved.filters) : { ...initialFilters }
  } catch { return { ...initialFilters } }
}

export function writeExpenseFilters(storage: Pick<Storage, 'setItem'>, userId: string | undefined, filters: FilterOptions) {
  if (!userId) return
  try { storage.setItem(storageKey(userId), JSON.stringify({ version: 1, filters: normalizeExpenseFilters(filters) })) } catch { /* Storage is optional; in-memory filters still work. */ }
}
