require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const Module = require('node:module')
let saved
const load = Module._load
Module._load = function (name, ...args) {
  if (name.startsWith('@/services/')) return { createRecurringExpense: async data => { saved = data }, fetchCategories: async () => [], fetchPaymentMethods: async () => [] }
  if (name === 'sonner') return { toast: { success() {}, error() {} } }
  return load.call(this, name, ...args)
}
const { RecurringExpenseForm } = require('../src/components/gastos-recurrentes/RecurringExpenseForm.tsx')
Module._load = load

async function harness(run) {
  const original = Object.fromEntries(['useState', 'useEffect'].map(k => [k, React[k]]))
  const slots = []; let index = 0
  React.useState = initial => { const key = index++; if (!(key in slots)) slots[key] = typeof initial === 'function' ? initial() : initial; return [slots[key], value => { slots[key] = typeof value === 'function' ? value(slots[key]) : value }] }
  React.useEffect = () => {}
  const render = () => { index = 0; return RecurringExpenseForm({}) }
  try { await run({ slots, render }) } finally { Object.assign(React, original) }
}
const base = { description: 'Netflix', amount: '15.99', categoryId: '1', paymentMethodId: '2', frecuencia: 'mensual', diaSemana: '', diaMes: '5', mesAnual: '', fechaInicio: '2026-10-01', fechaFin: '', activo: true }

test('recurrente con compra en el exterior guarda cada cobro con impuestos', async () => {
  await harness(async ({ slots, render }) => {
    render()
    const foreign = slots.findIndex(value => value && typeof value === 'object' && 'customRate' in value)
    assert.ok(foreign >= 0, 'falta el estado de compra en el exterior')
    slots[0] = { ...base }
    slots[foreign] = { enabled: true, selected: ['isd', 'iva_digital'], customRate: '' }
    await render().props.onSubmit({ preventDefault() {} })
    assert.equal(saved.monto, 19.19)
  })
})

test('recurrente sin impuestos conserva el monto y bloquea una selección vacía', async () => {
  await harness(async ({ slots, render }) => {
    render()
    const foreign = slots.findIndex(value => value && typeof value === 'object' && 'customRate' in value)
    slots[0] = { ...base }; saved = undefined
    await render().props.onSubmit({ preventDefault() {} })
    assert.equal(saved.monto, 15.99)
    slots[0] = { ...base }; saved = undefined
    slots[foreign] = { enabled: true, selected: [], customRate: '' }
    await render().props.onSubmit({ preventDefault() {} })
    assert.equal(saved, undefined)
  })
})
