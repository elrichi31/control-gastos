export type ExpenseSelection = { categoryId: string; paymentMethodId: string }
export type SuggestionHistory = {
  descripcion: string
  categoria_id?: number | null
  metodo_pago_id?: number | null
  categoria?: { id: number }
  metodo_pago?: { id: number }
}
const EMPTY: ExpenseSelection = { categoryId: '', paymentMethodId: '' }
const STOP_WORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'en', 'con', 'y', 'para', 'por', 'un', 'una'])
function normalize(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim()
}

/** Local suggestions from the already authenticated history; never makes network requests. */
export function predictExpenseSelection(
  description: string,
  history: readonly SuggestionHistory[],
  categories: readonly { id: number }[],
  paymentMethods: readonly { id: number }[],
): ExpenseSelection {
  const query = normalize(description)
  const words = query.split(' ').filter(word => word.length >= 3 && !STOP_WORDS.has(word))
  if (!words.length) return { ...EMPTY }
  let bestScore = 0
  let matches: SuggestionHistory[] = []
  for (const expense of history) {
    const text = normalize(expense.descripcion)
    const tokens = text.split(' ')
    const score = text === query ? 3 : text.startsWith(query) ? 2
      : words.every(word => tokens.some(token => token.startsWith(word))) ? 1 : 0
    if (!score || score < bestScore) continue
    if (score > bestScore) { bestScore = score; matches = [] }
    matches.push(expense)
  }
  function majority(field: 'categoria_id' | 'metodo_pago_id', catalog: readonly { id: number }[]) {
    const validIds = new Set(catalog.map(item => item.id))
    const votes = new Map<number, number>()
    for (const expense of matches) {
      // An explicit null is not evidence; do not infer from UI fallback relations.
      const id = field in expense ? expense[field]
        : field === 'categoria_id' ? expense.categoria?.id : expense.metodo_pago?.id
      if (id != null && validIds.has(id)) votes.set(id, (votes.get(id) || 0) + 1)
    }
    for (const [id, count] of votes) if (count > matches.length / 2) return String(id)
    return ''
  }
  return { categoryId: majority('categoria_id', categories), paymentMethodId: majority('metodo_pago_id', paymentMethods) }
}

/** Explicit choices always win, even when the description or history changes. */
export function resolveExpenseSelection(manual: ExpenseSelection, suggestion: ExpenseSelection): ExpenseSelection {
  return {
    categoryId: manual.categoryId || suggestion.categoryId,
    paymentMethodId: manual.paymentMethodId || suggestion.paymentMethodId,
  }
}
