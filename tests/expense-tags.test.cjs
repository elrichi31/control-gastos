require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const Module = require('node:module')
let calls = [], authorized = true
const db = { from(table) {
  const call = { table, filters: [] }; calls.push(call)
  const result = () => ({ data: table === 'presupuesto_categoria' ? [{ id: 2, categoria_id: 1, categoria: { nombre: 'Comida' } }] : { id: 1, tags: ['viaje'], ...(call.insert?.[0] || call.insert || call.update) }, error: null })
  const q = { select(value) { call.select = value; return q }, eq(...value) { call.filters.push(value); return q }, order() { return q }, insert(value) { call.insert = value; return q }, update(value) { call.update = value; return q }, single() { return Promise.resolve(result()) }, then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject) } }
  return q
} }
const load = Module._load
Module._load = function(name, ...args) {
  if (name === '@/lib/auth') return { getAuthenticatedSupabaseClient: async () => authorized ? { supabase: db, userId: 'owner' } : { error: Response.json({}, { status: 401 }) } }
  if (name === '@/lib/auth/budget-ownership') return { requireOwnedBudget: async () => null, requireOwnedBudgetCategory: async () => null, requireOwnedBudgetMovement: async () => null }
  if (name.startsWith('@/services/')) return { fetchCategories: async () => [], fetchPaymentMethods: async () => [], createExpense: async () => {} }
  return load.call(this, name, ...args)
}
const expenses = require('../src/app/api/gastos/route.ts')
const movements = require('../src/app/api/movimientos-categoria/route.ts')
const budgetDetails = require('../src/app/api/presupuesto-mensual-detalle/route.ts')
const { ExpenseForm } = require('../src/components/ExpenseForm.tsx')
Module._load = load
const { GastoCard } = require('../src/components/detalle-gastos/GastoCard.tsx')
const { GastoTableRow } = require('../src/components/detalle-gastos/GastoTableRow.tsx')
const { useExpenseFilters } = require('../src/hooks/useExpenseFilters.ts')
const base = { id: 1, presupuesto_categoria_id: 2, descripcion: 'Almuerzo', monto: 10, fecha: '2026-10-01', categoria_id: 1, metodo_pago_id: 1 }
const request = (body, method = 'POST') => new Request('https://fixture.invalid/api/gastos?id=1', { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
for (const [name, route] of [['gastos', expenses], ['presupuesto', movements]]) {
  test(`${name}: creates normalized optional tags and uses server ownership`, async () => {
    calls = []
    assert.equal((await route.POST(request({ ...base, tags: [' Viaje ', 'VIAJE', 'familia'], user_id: 'attacker' }))).status, 200)
    const row = Array.isArray(calls[0].insert) ? calls[0].insert[0] : calls[0].insert
    assert.deepEqual(row.tags, ['viaje', 'familia']); assert.equal(row.user_id, 'owner')
  })
  test(`${name}: omitted tags stay compatible; updates omit or explicitly clear tags`, async () => {
    calls = []; assert.equal((await route.POST(request(base))).status, 200)
    calls = []; assert.equal((await route.PUT(request(base, 'PUT'))).status, 200)
    assert.ok(!Object.hasOwn(calls[0].update, 'tags'))
    calls = []; assert.equal((await route.PUT(request({ ...base, tags: [] }, 'PUT'))).status, 200)
    assert.deepEqual(calls[0].update.tags, [])
    assert.ok(calls[0].filters.some(([key, value]) => key === 'user_id' && value === 'owner'))
  })
  test(`${name}: rejects invalid tags before database writes`, async () => {
    for (const tags of ['viaje', null, [5], ['x'.repeat(31)], Array.from({ length: 11 }, (_, i) => `tag${i}`)]) {
      for (const method of ['POST', 'PUT']) {
        calls = []; assert.equal((await route[method](request({ ...base, tags }, method))).status, 400)
        assert.equal(calls.length, 0)
      }
    }
  })
  test(`${name}: anonymous writes are rejected`, async () => {
    authorized = false; calls = []
    try { assert.equal((await route.POST(request(base))).status, 401); assert.equal(calls.length, 0) } finally { authorized = true }
  })
}
test('expense reads include persisted tags', async () => {
  calls = []; await expenses.GET(new Request('https://fixture.invalid'))
  assert.match(calls[0].select, /\btags\b/)
})
test('budget reads include tags and keep owner predicates', async () => {
  for (const route of [movements, budgetDetails]) {
    calls = []; assert.equal((await route.GET(new Request('https://fixture.invalid?presupuesto_mensual_id=1'))).status, 200)
    const call = calls.find(item => item.table === 'movimiento_presupuesto')
    assert.match(call.select, /\btags\b/); assert.ok(call.filters.some(([key, value]) => key === 'user_id' && value === 'owner'))
  }
})
test('creation offers an optional tags field without making it required', () => {
  const html = renderToStaticMarkup(React.createElement(ExpenseForm, { fetchExpenses() {} }))
  assert.match(html, /Etiquetas.*opcional/)
  assert.match(html, /id="expense-tags"/)
  assert.doesNotMatch(html.match(/<input[^>]*id="expense-tags"[^>]*>/)?.[0] || '', /required/)
})
test('expense lists display tags but no placeholder for untagged expenses', () => {
  for (const Component of [GastoCard, GastoTableRow]) {
    const props = { gasto: { ...base, tags: ['viaje', 'familia'] }, onDeleteGasto() {}, formatDate: x => x, formatMoney: x => `$${x}` }
    const html = renderToStaticMarkup(React.createElement(Component, props))
    assert.match(html, /#viaje/); assert.match(html, /#familia/)
    const untagged = renderToStaticMarkup(React.createElement(Component, { ...props, gasto: base }))
    assert.doesNotMatch(untagged, /Sin etiquetas|#viaje/)
  }
})
test('search matches tags without changing other expense filters', () => {
  const originalState = React.useState
  React.useState = initial => typeof initial === 'object' && initial.filters ? [{ ...initial, filters: { ...initial.filters, search: 'VIAJE', dateRange: 'all-time' } }, () => {}] : originalState(initial)
  function Probe() { const { filteredGastos } = useExpenseFilters([{ ...base, tags: ['viaje'], categoria: { id: 1, nombre: 'Comida' } }]); return React.createElement('span', null, filteredGastos.length) }
  try { assert.equal(renderToStaticMarkup(React.createElement(Probe)), '<span>1</span>') } finally { React.useState = originalState }
})
test('origin filter separates email-imported ("auto") from manual expenses', () => {
  const gastos = [
    { ...base, id: 1, tags: ['auto'], categoria: { id: 1, nombre: 'Comida' } },
    { ...base, id: 2, tags: ['viaje'], categoria: { id: 1, nombre: 'Comida' } },
    { ...base, id: 3, categoria: { id: 1, nombre: 'Comida' } },
  ]
  const originalState = React.useState
  for (const [origin, expected] of [['email', '1'], ['manual', '2,3'], ['', '1,2,3']]) {
    React.useState = initial => typeof initial === 'object' && initial.filters ? [{ ...initial, filters: { ...initial.filters, origin, dateRange: 'all-time' } }, () => {}] : originalState(initial)
    function Probe() { const { filteredGastos } = useExpenseFilters(gastos); return React.createElement('span', null, filteredGastos.map(g => g.id).sort().join(',')) }
    try { assert.equal(renderToStaticMarkup(React.createElement(Probe)), `<span>${expected}</span>`) } finally { React.useState = originalState }
  }
})
