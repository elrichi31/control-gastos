/** Tag que marca los gastos pagados en el exterior, para poder filtrarlos después. */
export const FOREIGN_EXPENSE_TAG = 'exterior'

export type ForeignTaxId = 'isd' | 'iva_digital' | 'custom'

/** Recargos que cobra el banco en Ecuador al pagar con tarjeta en el exterior. */
export const FOREIGN_TAXES: readonly { id: Exclude<ForeignTaxId, 'custom'>; label: string; short: string; rate: number; hint: string }[] = [
  { id: 'isd', label: 'Salida de divisas (ISD)', short: 'ISD', rate: 5, hint: 'Compras con tarjeta en tiendas del exterior (Amazon, AliExpress, viajes).' },
  { id: 'iva_digital', label: 'IVA servicios digitales', short: 'IVA', rate: 15, hint: 'Suscripciones y apps extranjeras (Netflix, Spotify, ChatGPT, Google, Apple).' },
]

export type ForeignTaxState = { enabled: boolean; selected: ForeignTaxId[]; customRate: string }
export const emptyForeignTax = (): ForeignTaxState => ({ enabled: false, selected: ['isd'], customRate: '' })

export type ForeignTaxLine = { id: ForeignTaxId; label: string; rate: number; amount: number }
export type ForeignTaxBreakdown = { base: number; lines: ForeignTaxLine[]; taxTotal: number; total: number }

const cents = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

/** Tasa personalizada válida (0 < tasa ≤ 100, hasta 2 decimales) o null. */
export function parseCustomRate(text: string): number | null {
  const value = Number(text.replace(',', '.'))
  if (!text.trim() || !Number.isFinite(value) || value <= 0 || value > 100) return null
  return cents(value)
}

/**
 * Cada impuesto se calcula sobre el precio original y se redondea a centavos,
 * igual que aparecen como líneas separadas en el estado de cuenta.
 */
export function computeForeignTax(base: number, state: ForeignTaxState): ForeignTaxBreakdown {
  const safeBase = Number.isFinite(base) && base > 0 ? cents(base) : 0
  const lines: ForeignTaxLine[] = []
  if (state.enabled) {
    for (const tax of FOREIGN_TAXES) {
      if (state.selected.includes(tax.id)) lines.push({ id: tax.id, label: `${tax.short} ${tax.rate}%`, rate: tax.rate, amount: cents(safeBase * tax.rate / 100) })
    }
    const custom = state.selected.includes('custom') ? parseCustomRate(state.customRate) : null
    if (custom !== null) lines.push({ id: 'custom', label: `Otro ${custom}%`, rate: custom, amount: cents(safeBase * custom / 100) })
  }
  const taxTotal = cents(lines.reduce((sum, line) => sum + line.amount, 0))
  return { base: safeBase, lines, taxTotal, total: cents(safeBase + taxTotal) }
}

/** Mensaje de error si la configuración no se puede guardar, o null si está bien. */
export function validateForeignTax(state: ForeignTaxState): string | null {
  if (!state.enabled) return null
  if (state.selected.length === 0) return 'Elige al menos un impuesto o desactiva "Compra en el exterior".'
  if (state.selected.includes('custom') && parseCustomRate(state.customRate) === null) return 'Ingresa un porcentaje entre 0 y 100.'
  return null
}

/** Agrega #exterior a las etiquetas sin duplicarla ni pasar el límite. */
export function withForeignTag(tags: string[], state: ForeignTaxState, max = 10): string[] {
  if (!state.enabled || tags.includes(FOREIGN_EXPENSE_TAG) || tags.length >= max) return tags
  return [...tags, FOREIGN_EXPENSE_TAG]
}

const TAX_IDS: readonly ForeignTaxId[] = ['isd', 'iva_digital', 'custom']

/** Valida lo que llega por la API: `{ selected: [...], customRate? }`. null si no es válido. */
export function parseForeignTaxInput(value: unknown): ForeignTaxState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const data = value as Record<string, unknown>
  if (!Array.isArray(data.selected) || data.selected.some(id => !TAX_IDS.includes(id as ForeignTaxId))) return null
  if (data.customRate !== undefined && typeof data.customRate !== 'string' && typeof data.customRate !== 'number') return null
  const state: ForeignTaxState = { enabled: true, selected: [...new Set(data.selected as ForeignTaxId[])], customRate: data.customRate === undefined ? '' : String(data.customRate) }
  return validateForeignTax(state) ? null : state
}

/** Lo que se guarda en la columna `impuesto_exterior`: precio original + impuestos elegidos. */
export type StoredForeignTax = { base: number; selected: ForeignTaxId[]; customRate: string }

/** Valida el JSON guardado o enviado por la API. null si no es válido. */
export function parseStoredForeignTax(value: unknown): StoredForeignTax | null {
  const state = parseForeignTaxInput(value)
  const base = (value as Record<string, unknown> | null)?.base
  if (!state || typeof base !== 'number' || !Number.isFinite(base) || base <= 0 || base > 999999999 || Math.abs(base * 100 - Math.round(base * 100)) > 0.000001) return null
  return { base, selected: state.selected, customRate: state.customRate }
}

/** Estado del formulario a partir de lo guardado (o desactivado si no hay nada). */
export function foreignTaxFromStored(value: unknown): ForeignTaxState {
  const stored = parseStoredForeignTax(value)
  return stored ? { enabled: true, selected: stored.selected, customRate: stored.customRate } : emptyForeignTax()
}

/** Valor a guardar: el detalle si está activo, null para borrarlo, undefined para no tocar la columna. */
export function storedForeignTax(base: number, state: ForeignTaxState, hadStored = false): StoredForeignTax | null | undefined {
  if (state.enabled) return { base: computeForeignTax(base, state).base, selected: state.selected, customRate: state.selected.includes('custom') ? state.customRate : '' }
  return hadStored ? null : undefined
}

/** PostgREST/Postgres cuando la columna aún no existe (migración sin aplicar). */
export const isMissingColumnError = (error: { code?: string } | null | undefined) => ['PGRST204', '42703'].includes(error?.code ?? '')
