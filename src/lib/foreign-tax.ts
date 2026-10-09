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
