const { fixtures: remoteFixtures } = require('./helpers/remote-ui.cjs')
require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const Module = require('node:module')
const load = Module._load
Module._load = function (name, ...args) {
  if (name.startsWith('@/services/')) return { fetchCategories: async () => [], fetchPaymentMethods: async () => [], createExpense: async () => {} }
  return load.call(this, name, ...args)
}
const { ExpenseForm } = require('../src/components/gastos/ExpenseForm.tsx')
Module._load = load
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props))

test('el monto conserva la captura decimal sin suprimir el foco visible del campo', () => {
  const html = render(ExpenseForm, { fetchExpenses() {} })
  const amount = html.match(/<input[^>]*id="amount"[^>]*>/)?.[0]
  assert.ok(amount)
  assert.equal(amount.includes('focus-visible:ring-0'), false, 'El monto debe usar el foco visible del Input compartido')
  assert.match(amount, /inputMode="decimal"|inputmode="decimal"/)
  assert.match(amount, /min="0.01"/)
  assert.match(amount, /step="0.01"/)
  assert.ok(html.indexOf('id="amount"') < html.indexOf('id="description"'))
})
