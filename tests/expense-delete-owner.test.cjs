require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const Module = require('node:module')
const originalLoad = Module._load
let directDeletes = 0
Module._load = function(name, ...args) {
  if (name === '@/services/expenses') return { deleteExpense: async () => { directDeletes++ } }
  if (name === 'sonner') return { toast: { success() {}, error() {} } }
  return originalLoad.call(this, name, ...args)
}
const { ExpenseItem } = require('../src/components/gastos/ExpenseItem.tsx')
const { ConfirmModal } = require('../src/components/ui/confirm-modal.tsx')
Module._load = originalLoad
function elements(node) { return !node || typeof node !== 'object' ? [] : [node, ...React.Children.toArray(node.props?.children).flatMap(elements)] }

test('confirming deletion awaits one parent mutation and does not issue a second DELETE', async () => {
  const originalState = React.useState
  React.useState = initial => [initial, () => {}]
  let parentCalls = 0, release
  try {
    const tree = elements(ExpenseItem({ expense: { id: 17, descripcion: 'Compra', monto: 20, fecha: '2026-10-01' },
      onDelete: id => { assert.equal(id, '17'); parentCalls++; return new Promise(resolve => { release = resolve }) } }))
    const confirmation = tree.find(node => node.type === ConfirmModal)
    const pending = confirmation.props.onConfirm()
    assert.equal(parentCalls, 1)
    assert.equal(directDeletes, 0)
    let completed = false; pending.then(() => { completed = true })
    await Promise.resolve(); assert.equal(completed, false)
    release(); await pending; assert.equal(completed, true)
  } finally { React.useState = originalState }
})

test('weekly groups retain distinct identities at the beginning and end of the same year', () => {
  const { useGastosGrouping } = require('../src/hooks/useGastosGrouping.ts')
  const originalState = React.useState, originalMemo = React.useMemo, originalEffect = React.useEffect
  let expanded
  React.useState = initial => [initial, value => { expanded = value }]; React.useMemo = fn => fn(); React.useEffect = fn => fn()
  try {
    const { groupedGastos } = useGastosGrouping([
      { id: 1, fecha: '2018-01-01', monto: 10 },
      { id: 2, fecha: '2018-12-31', monto: 20 },
    ], 'week')
    assert.equal(groupedGastos.length, 2)
    assert.equal(new Set(groupedGastos.map(group => group.key)).size, 2)
    assert.deepEqual([...expanded], groupedGastos.map(group => group.key))
    assert.deepEqual(groupedGastos.map(group => group.total), [20, 10])
  } finally { React.useState = originalState; React.useMemo = originalMemo; React.useEffect = originalEffect }
})
