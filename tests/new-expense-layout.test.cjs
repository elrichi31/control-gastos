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
const { ExpenseSummary } = require('../src/components/gastos/ExpenseSummary.tsx')
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

test('el resumen muestra el total antes de los filtros y permite desplegar todos sus controles', () => {
  const html = render(ExpenseSummary, { expenses: [{ monto: 12.5 }, { monto: 54.8 }], groupBy: 'dia', setGroupBy() {}, onDateRangeChange() {} })
  assert.ok(html.indexOf('Total de gastos') < html.indexOf('Desde'), 'El total debe ser la lectura principal del resumen')
  assert.match(html, /\$67\.30/)
  assert.match(html, /2 gastos filtrados/)
  assert.match(html, /<details[^>]*>.*<summary[^>]*>.*Filtrar y agrupar/)
  assert.equal(/<details[^>]*\sopen(?:=|>)/.test(html), false)
  assert.match(html, /Desde/)
  assert.match(html, /Hasta/)
  assert.match(html, /Agrupar por/)
  assert.match(html, /Limpiar filtros/)
})

test('el período del resumen sigue visible aunque los filtros estén cerrados', () => {
  const html = render(ExpenseSummary, { expenses: [], groupBy: 'dia', setGroupBy() {}, onDateRangeChange() {} })
  const beforeFilters = html.slice(0, html.indexOf('<details'))
  assert.match(beforeFilters, /aria-label="Período del resumen"/)
  assert.match(beforeFilters, /\d{2}\/\d{2}\/\d{4} al \d{2}\/\d{2}\/\d{4}/)
})
