const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
require('./helpers/register-ts.cjs')
const file = path.resolve(__dirname, '../src/lib/expense-suggestions.ts')
function api() {
  assert.ok(fs.existsSync(file), 'Falta implementar el predictor del formulario web')
  return require(file)
}
const categories = [{ id: 1 }, { id: 2 }]
const methods = [{ id: 3 }, { id: 4 }]
const expense = (descripcion, categoria_id = 1, metodo_pago_id = 3) => ({ descripcion, categoria_id, metodo_pago_id })
const empty = { categoryId: '', paymentMethodId: '' }
const predict = (description, history, cats = categories, pays = methods) => api().predictExpenseSelection(description, history, cats, pays)

test('normalizes accents, casing, punctuation and whitespace', () => {
  assert.deepEqual(predict('  CAFÉ!   ', [expense('Café')]), { categoryId: '1', paymentMethodId: '3' })
})
test('predicts while typing the beginning of a historical description', () => {
  assert.deepEqual(predict('super', [expense('Supermercado semanal', 2, 4)]), { categoryId: '2', paymentMethodId: '4' })
})
test('recognizes meaningful words in a different order', () => {
  assert.deepEqual(predict('cafe oficina', [expense('Oficina: café', 2, 4)]), { categoryId: '2', paymentMethodId: '4' })
})
test('exact matches outrank more frequent prefix matches', () => {
  assert.deepEqual(predict('cafe', [expense('cafe', 2, 4), expense('cafe oficina'), expense('cafe oficina')]), { categoryId: '2', paymentMethodId: '4' })
})
test('uses a strict majority independently for each field', () => {
  assert.deepEqual(predict('almuerzo', [expense('almuerzo', 1, 3), expense('almuerzo', 1, 4), expense('almuerzo', 2, 4)]), { categoryId: '1', paymentMethodId: '4' })
})
test('does not guess ambiguous fields', () => {
  assert.deepEqual(predict('almuerzo', [expense('almuerzo', 1, 3), expense('almuerzo', 1, 4)]), { categoryId: '1', paymentMethodId: '' })
})
test('does not guess for short, blank, irrelevant or unmatched text', () => {
  for (const text of ['', '  ', 'ca', 'de la', 'gasolina']) assert.deepEqual(predict(text, [expense('cafe')]), empty)
  assert.deepEqual(predict('cafe', []), empty)
})
test('never returns IDs missing from the available catalogs', () => {
  assert.deepEqual(predict('cafe', [expense('cafe', 99, 99)]), empty)
})
test('supports joined historical IDs without inventing a payment method', () => {
  assert.deepEqual(predict('cafe', [{ descripcion: 'cafe', categoria: { id: 2 }, metodo_pago: { id: 4 } }]), { categoryId: '2', paymentMethodId: '4' })
  assert.deepEqual(predict('cafe', [{ descripcion: 'cafe', categoria_id: 2, metodo_pago_id: null, metodo_pago: { id: 3 } }]), { categoryId: '2', paymentMethodId: '' })
})
test('manual category and payment method override suggestions independently', () => {
  const { resolveExpenseSelection } = api()
  const suggestion = { categoryId: '1', paymentMethodId: '3' }
  assert.deepEqual(resolveExpenseSelection({ categoryId: '2', paymentMethodId: '' }, suggestion), { categoryId: '2', paymentMethodId: '3' })
  assert.deepEqual(resolveExpenseSelection({ categoryId: '', paymentMethodId: '4' }, suggestion), { categoryId: '1', paymentMethodId: '4' })
  assert.deepEqual(resolveExpenseSelection({ categoryId: '2', paymentMethodId: '4' }, empty), { categoryId: '2', paymentMethodId: '4' })
  assert.deepEqual(resolveExpenseSelection(empty, empty), empty)
})
