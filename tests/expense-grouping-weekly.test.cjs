require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')

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
