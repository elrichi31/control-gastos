const { fixtures: remoteFixtures } = require('./helpers/remote-ui.cjs')
require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const Module = require('node:module')
const { renderToStaticMarkup } = require('react-dom/server')
const originalLoad = Module._load
Module._load = function(name, ...args) {
  if (name === '@/hooks/useExpensesStore') return { useExpensesStore: () => ({ gastos: [] }) }
  return originalLoad.call(this, name, ...args)
}
const { RecurringExpenseList } = require('../src/components/gastos-recurrentes/RecurringExpenseList.tsx')
Module._load = originalLoad

test('lista recurrente muestra confirmación en desktop y móvil sin reemplazar su precio configurado', () => {
  const original = { useState: React.useState, useEffect: React.useEffect, useMemo: React.useMemo }
  const rule = { id: 7, descripcion: 'Netflix', monto: 10, activo: true, frecuencia: 'mensual', dia_mes: 15, fecha_inicio: '2026-01-01', categoria_id: 1, metodo_pago_id: 2 }
  let index = 0
  const slots = [[rule], [{ id: 1, nombre: 'Entretenimiento' }], [{ id: 2, nombre: 'Crédito' }], false]
  slots[10] = { 7: { estado: 'confirmado', fecha: '2026-10-15', monto: 12 } }
  React.useState = initial => [typeof initial === 'function' ? initial() : initial, () => {}]
  React.useEffect = () => {}; React.useMemo = fn => fn()
  remoteFixtures.set('recurring:list', () => slots[0])
  remoteFixtures.set('recurring:email', () => slots[10])
  remoteFixtures.set('catalogs', () => ({ categories: slots[1], paymentMethods: slots[2] }))
  let tree
  try { tree = RecurringExpenseList() } finally { Object.assign(React, original) }
  const html = renderToStaticMarkup(tree)
  assert.equal((html.match(/Confirmado por correo/g) || []).length, 2)
  assert.match(html, /10\.00/)
  assert.match(html, /2026-10-15/)
})
