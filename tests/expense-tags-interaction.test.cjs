require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const Module = require('node:module')
let saved, failSave = false
const services = { createExpense: async data => { if (failSave) throw new Error('fixture offline'); saved = data }, addBudgetExpense: async data => { saved = data }, updateBudgetExpense: async data => { saved = data }, fetchPresupuestoCategorias: async () => [], updatePresupuestoTotal: async () => {}, calculateBudgetTotal: () => 0, calculateTotalGastosRegistrados: () => 0 }
const load = Module._load
Module._load = function(name, ...args) {
  if (name.startsWith('@/services/')) return services
  if (name === 'sonner') return { toast: { success() {}, error() {} } }
  return load.call(this, name, ...args)
}
const { ExpenseForm } = require('../src/components/gastos/ExpenseForm.tsx')
const { useBudgetDetailsData } = require('../src/hooks/useBudgetDetailsData.ts')
Module._load = load
const { ExpenseTagsField } = require('../src/components/gastos/ExpenseTags.tsx')
// Exercise real component handlers with a bounded hook harness. External services
// are mocked; this is not live browser or Supabase integration evidence.
async function harness(run) {
  const original = Object.fromEntries(['useState', 'useEffect', 'useMemo', 'useRef', 'useCallback'].map(k => [k, React[k]]))
  let slots = [], refs = [], index = 0, refIndex = 0
  React.useState = initial => { const key = index++; if (!(key in slots)) slots[key] = typeof initial === 'function' ? initial() : initial; return [slots[key], value => { slots[key] = typeof value === 'function' ? value(slots[key]) : value }] }
  React.useEffect = () => {}
  React.useMemo = fn => fn()
  React.useCallback = fn => fn
  React.useRef = initial => { const key = refIndex++; return refs[key] ||= { current: initial } }
  const render = fn => { index = 0; refIndex = 0; return fn() }
  try { await run({ slots, render }) } finally { Object.assign(React, original) }
}
const event = { preventDefault() {}, nativeEvent: {} }
test('real capture handler sends normalized tags, permits omission and clears tags after success', async () => {
  await harness(async ({ slots, render }) => {
    const form = () => ExpenseForm({ fetchExpenses() {} })
    render(form)
    slots[0] = { description: 'Almuerzo', amount: '12', categoryId: '1', paymentMethodId: '1', date: '2026-10-01', tags: ' Viaje, VIAJE, familia ' }
    slots[4] = [{ id: 1, nombre: 'Comida' }]; slots[5] = [{ id: 1, nombre: 'Efectivo' }]; slots[6] = false
    await render(form).props.onSubmit(event)
    assert.deepEqual(saved.tags, ['viaje', 'familia']); assert.equal(slots[0].tags, '')
    slots[0] = { ...slots[0], description: 'Otro', amount: '1', categoryId: '1', paymentMethodId: '1', tags: '' }
    await render(form).props.onSubmit(event)
    assert.deepEqual(saved.tags, [])
  })
})
test('real capture handler blocks invalid tags and retains tags when saving fails', async () => {
  await harness(async ({ slots, render }) => {
    const form = () => ExpenseForm({ fetchExpenses() {} }); render(form)
    slots[0] = { description: 'Almuerzo', amount: '12', categoryId: '1', paymentMethodId: '1', date: '2026-10-01', tags: 'x'.repeat(31) }
    slots[4] = [{ id: 1 }]; slots[5] = [{ id: 1 }]; slots[6] = false; saved = undefined
    await render(form).props.onSubmit(event)
    assert.equal(saved, undefined); assert.match(slots[2].tags, /30/)
    slots[0].tags = 'familia'; failSave = true
    const log = console.error; console.error = () => {}
    try { await render(form).props.onSubmit(event); assert.equal(slots[0].tags, 'familia'); assert.match(slots[3], /No se pudo guardar/) } finally { failSave = false; console.error = log }
  })
})
test('real budget handlers restore, edit, clear and persist optional tags', async () => {
  await harness(async ({ slots, render }) => {
    const hook = () => useBudgetDetailsData('1')
    render(hook).prepareEditExpense({ id: 9, descripcion: 'Hotel', monto: 20, fecha: '2026-10-01', metodo_pago_id: 1, tags: ['viaje', 'familia'] }, 2)
    assert.equal(slots[5].tags, 'viaje, familia')
    slots[5].tags = ' Familia, trabajo '
    assert.equal(await render(hook).handleUpdateExpense(), true)
    assert.deepEqual(saved.tags, ['familia', 'trabajo']); assert.equal(slots[5].tags, '')
    render(hook).prepareEditExpense({ id: 9, descripcion: 'Hotel', monto: 20, fecha: '2026-10-01', metodo_pago_id: 1, tags: ['viaje'] }, 2)
    slots[5].tags = ''
    await render(hook).handleUpdateExpense(); assert.deepEqual(saved.tags, [])
    slots[5] = { name: 'Nuevo', amount: '10', paymentDate: '2026-10-01', category: '2', metodoPago: '1', tags: 'familia' }
    await render(hook).handleAddExpense(); assert.deepEqual(saved.tags, ['familia'])
  })
})
function elements(node) { if (!node || typeof node !== 'object') return []; return [node, ...React.Children.toArray(node.props?.children).flatMap(elements)] }
test('real tags field handles typing and removes a chip without submitting the form', () => {
  let value
  const tree = elements(ExpenseTagsField({ value: 'viaje, familia', onChange: next => { value = next } }))
  tree.find(x => x.props?.id === 'expense-tags').props.onChange({ target: { value: 'trabajo' } })
  assert.equal(value, 'trabajo')
  const button = tree.find(x => x.props?.['aria-label'] === 'Quitar etiqueta viaje')
  assert.equal(button.props.type, 'button'); button.props.onClick(); assert.equal(value, 'familia')
})
