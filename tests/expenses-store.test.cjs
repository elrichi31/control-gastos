require('./helpers/register-ts.cjs')
const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const Module = require('node:module')

let calls = 0, nextResult
const originalLoad = Module._load
Module._load = function (name, ...args) {
  if (name === '@/services/expenses') return { fetchExpenses: async () => { calls++; return nextResult() } }
  return originalLoad.call(this, name, ...args)
}
const store = require('../src/hooks/useExpensesStore.ts')
Module._load = originalLoad

// Sin DOM: el hook se ejecuta como función; useEffect corre al instante y useSyncExternalStore lee el snapshot.
React.useEffect = fn => { fn() }
React.useSyncExternalStore = (_subscribe, getSnapshot) => getSnapshot()
const gasto = id => ({ id, descripcion: `G${id}`, monto: 10, fecha: '2026-10-01', categoria_id: 1, categoria: { id: 1, nombre: 'Comida' } })
const settle = () => new Promise(resolve => setTimeout(resolve, 0))

beforeEach(() => { store.resetExpensesStore(); calls = 0; nextResult = () => [gasto(1)] })

test('dos consumidores disparan una sola descarga y comparten los datos', async () => {
  store.useExpensesStore(); store.useExpensesStore()
  assert.equal(calls, 1)
  await settle()
  const view = store.useExpensesStore()
  assert.equal(calls, 1, 'con datos cargados no se vuelve a descargar')
  assert.deepEqual(view.gastos.map(g => g.id), [1])
  assert.equal(view.loading, false)
})

test('refreshExpenses vuelve a descargar y mantiene los datos anteriores mientras tanto', async () => {
  store.useExpensesStore(); await settle()
  nextResult = () => [gasto(1), gasto(2)]
  const pending = store.refreshExpenses()
  assert.equal(store.useExpensesStore().gastos.length, 1, 'se siguen mostrando los anteriores')
  assert.equal(store.useExpensesStore().loading, false)
  await pending
  assert.equal(calls, 2)
  assert.deepEqual(store.useExpensesStore().gastos.map(g => g.id), [1, 2])
})

test('resetExpensesStore vacía los gastos y descarta una descarga en vuelo', async () => {
  const runEffects = React.useEffect, skipEffects = () => {}
  store.useExpensesStore(); await settle()
  store.resetExpensesStore()
  React.useEffect = skipEffects
  const cleared = store.useExpensesStore()
  assert.deepEqual(cleared.gastos, [])
  assert.equal(cleared.loading, true)
  React.useEffect = runEffects
  nextResult = () => [gasto(9)]
  store.useExpensesStore() // empieza una descarga...
  store.resetExpensesStore() // ...que el reset invalida
  await settle()
  React.useEffect = skipEffects
  assert.deepEqual(store.useExpensesStore().gastos, [], 'el resultado tardío del usuario anterior se descarta')
  React.useEffect = runEffects
})

test('un fallo en el refresh conserva los datos anteriores y setea error', async () => {
  store.useExpensesStore(); await settle()
  nextResult = () => { throw new Error('sin red') }
  await store.refreshExpenses()
  const view = store.useExpensesStore()
  assert.deepEqual(view.gastos.map(g => g.id), [1])
  assert.equal(view.error, 'sin red')
  assert.equal(view.loading, false)
  nextResult = () => [gasto(1)]
  await store.refreshExpenses()
  assert.equal(store.useExpensesStore().error, null)
})
