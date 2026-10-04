export const MAX_EXPENSE_TAGS = 10
export const MAX_EXPENSE_TAG_LENGTH = 30

/** API input is an array; omitted tags remain compatible with existing clients. */
export function normalizeExpenseTags(value: unknown): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.some(tag => typeof tag !== 'string')) {
    throw new Error('Las etiquetas deben ser una lista de textos.')
  }
  const tags = [...new Set((value as string[]).map(tag => tag.normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase()).filter(Boolean))]
  if (tags.length > MAX_EXPENSE_TAGS) throw new Error(`Puedes agregar hasta ${MAX_EXPENSE_TAGS} etiquetas.`)
  if (tags.some(tag => Array.from(tag).length > MAX_EXPENSE_TAG_LENGTH || /[,\u0000-\u001f\u007f]/u.test(tag))) {
    throw new Error(`Cada etiqueta debe tener hasta ${MAX_EXPENSE_TAG_LENGTH} caracteres, sin comas ni caracteres de control.`)
  }
  return tags
}

export function parseExpenseTags(text: string): string[] {
  return normalizeExpenseTags(text.split(','))
}
