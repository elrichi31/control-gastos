const { fixtures: remoteFixtures } = require('./helpers/remote-ui.cjs')
require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const Module = require('node:module')
let saved, failSave = false
const services = { createExpense: async data => { if (failSave) throw new Error('fixture offline'); saved = data }, addBudgetExpense: async data => { saved = data }, updateBudgetExpense: async data => { saved = data }, fetchPresupuestoCategorias: async () => [], updatePresupuestoTotal: async () => {}, calculateBudgetTotal: () => 0, calculateTotalGastosRegistrados: () => 0 }
const load = Module._load
Module._load = function(name, ...args) {
  if (name === '@tanstack/react-query') return { useQueryClient: () => ({ invalidateQueries: async () => {} }) }
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
  try { await run({ slots, refs, render }) } finally { Object.assign(React, original) }
}
const event = { preventDefault() {}, nativeEvent: {} }
test('real capture handler sends normalized tags, permits omission and clears tags after success', async () => {
  await harness(async ({ slots, render }) => {
    const form = () => ExpenseForm({ fetchExpenses() {} })
    render(form)
    slots[0] = { description: 'Almuerzo', amount: '12', categoryId: '1', paymentMethodId: '1', date: '2026-10-01', tags: ' Viaje, VIAJE, familia ' }

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
    saved = undefined
    await render(form).props.onSubmit(event)
    assert.equal(saved, undefined); assert.match(slots[2].tags, /30/)
    slots[0].tags = 'familia'; failSave = true
    const log = console.error; console.error = () => {}
    try { await render(form).props.onSubmit(event); assert.equal(slots[0].tags, 'familia'); assert.match(slots[3], /No se pudo guardar/) } finally { failSave = false; console.error = log }
  })
})
test('modal capture closes only after a normal save and reports the saving lifecycle', async () => {
  await harness(async ({ slots, render }) => {
    let closed = 0
    const busy = []
    const form = () => ExpenseForm({ fetchExpenses() {}, onSuccess() { closed++ }, onSubmittingChange(value) { busy.push(value) } })
    render(form)
    slots[0] = { description: 'Almuerzo', amount: '12', categoryId: '1', paymentMethodId: '1', date: '2026-10-01', tags: '' }
    await render(form).props.onSubmit(event)
    assert.equal(closed, 1)
    assert.deepEqual(busy, [true, false])
  })
})
test('modal capture keeps the form open for another expense and retains its date, category and payment', async () => {
  await harness(async ({ slots, render }) => {
    let closed = 0
    const form = () => ExpenseForm({ fetchExpenses() {}, onSuccess() { closed++ } })
    render(form)
    slots[0] = { description: 'Almuerzo', amount: '12', categoryId: '1', paymentMethodId: '1', date: '2026-10-01', tags: '' }
    const previousRAF = global.requestAnimationFrame
    global.requestAnimationFrame = fn => fn()
    try { await render(form).props.onSubmit({ preventDefault() {}, nativeEvent: { submitter: { getAttribute: () => 'another' } } }) }
    finally { if (previousRAF === undefined) delete global.requestAnimationFrame; else global.requestAnimationFrame = previousRAF }
    assert.equal(closed, 0)
    assert.deepEqual(slots[0], { description: '', amount: '', categoryId: '1', paymentMethodId: '1', date: '2026-10-01', tags: '' })
  })
})
test('modal capture stays open with entered data after a failed save and releases the close guard', async () => {
  await harness(async ({ slots, render }) => {
    let closed = 0
    const busy = []
    const form = () => ExpenseForm({ fetchExpenses() {}, onSuccess() { closed++ }, onSubmittingChange(value) { busy.push(value) } })
    render(form)
    const entered = { description: 'Almuerzo', amount: '12', categoryId: '1', paymentMethodId: '1', date: '2026-10-01', tags: 'familia' }
    slots[0] = entered
    const log = console.error
    console.error = () => {}; failSave = true
    try { await render(form).props.onSubmit(event) }
    finally { failSave = false; console.error = log }
    assert.equal(closed, 0)
    assert.deepEqual(slots[0], entered)
    assert.deepEqual(busy, [true, false])
    assert.match(slots[3], /Tus datos siguen aquí/)
  })
})
test('real budget handlers restore, edit, clear and persist optional tags', async () => {
  await harness(async ({ slots, render }) => {
    const hook = () => useBudgetDetailsData('1')
    render(hook).prepareEditExpense({ id: 9, descripcion: 'Hotel', monto: 20, fecha: '2026-10-01', metodo_pago_id: 1, tags: ['viaje', 'familia'] }, 2)
    assert.equal(slots[0].tags, 'viaje, familia')
    slots[0].tags = ' Familia, trabajo '
    assert.equal(await render(hook).handleUpdateExpense(), true)
    assert.deepEqual(saved.tags, ['familia', 'trabajo']); assert.equal(slots[0].tags, '')
    render(hook).prepareEditExpense({ id: 9, descripcion: 'Hotel', monto: 20, fecha: '2026-10-01', metodo_pago_id: 1, tags: ['viaje'] }, 2)
    slots[0].tags = ''
    await render(hook).handleUpdateExpense(); assert.deepEqual(saved.tags, [])
    slots[0] = { name: 'Nuevo', amount: '10', paymentDate: '2026-10-01', category: '2', metodoPago: '1', tags: 'familia' }
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

test('invalid optional tags expand their details and receive focus before saving', async () => {
  await harness(async ({ slots, refs, render }) => {
    const form = () => ExpenseForm({ fetchExpenses() {} })
    render(form)
    slots[0] = { description: 'Almuerzo', amount: '12', categoryId: '1', paymentMethodId: '1', date: '2026-10-25', tags: 'x'.repeat(31) }
    const details = { open: false }; let focused = false
    refs[1].current = { querySelector: selector => selector === '#expense-extra-details' ? details : selector === '#expense-tags' ? { focus() { focused = true } } : null }
    saved = undefined
    await render(form).props.onSubmit(event)
    assert.equal(details.open, true)
    assert.equal(focused, true)
    assert.equal(saved, undefined)
  })
})
