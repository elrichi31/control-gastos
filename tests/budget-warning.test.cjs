require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { budgetCrossing, categoryUsage } = require('../src/lib/month-planning.ts')

test('budgetCrossing avisa solo al cruzar 80% y 100%', () => {
  assert.equal(budgetCrossing(70, 85, 100), 'near')
  assert.equal(budgetCrossing(85, 90, 100), null, 'ya había pasado el 80%')
  assert.equal(budgetCrossing(90, 110, 100), 'exceeded')
  assert.equal(budgetCrossing(110, 120, 100), null, 'ya estaba excedido')
  assert.equal(budgetCrossing(10, 20, 100), null)
})

test('budgetCrossing: bordes exactos y presupuesto 0', () => {
  assert.equal(budgetCrossing(70, 80, 100), 'near', '80% exacto avisa')
  assert.equal(budgetCrossing(80, 100, 100), null, '100% exacto no es excedido')
  assert.equal(budgetCrossing(100, 100.01, 100), 'exceeded')
  assert.equal(budgetCrossing(50, 100, 100), 'near', 'saltar de <80% a 100% exacto avisa near')
  assert.equal(budgetCrossing(0, 5, 0), 'exceeded', 'sin presupuesto asignado, cualquier gasto lo excede')
  assert.equal(budgetCrossing(0, 0, 0), null)
  assert.equal(budgetCrossing(0.1 + 0.2, 0.3 + 0.5, 1), 'near', 'sin errores de coma flotante')
})

test('categoryUsage suma movimientos y gastos del mes', () => {
  const cats = [
    { categoria_id: 1, categoria: { nombre: 'Comida', icono: '🍕' }, movimientos: [{ monto: 60 }, { monto: '40.5' }] },
    { categoria_id: 2, categoria: { nombre: 'Ocio' } },
  ]
  const gastos = [
    { categoria_id: 1, monto: 30, fecha: '2026-10-03' },
    { categoria_id: 1, monto: 5, fecha: '2026-10-31T12:00:00' },
    { categoria_id: 1, monto: 99, fecha: '2026-09-30' },
    { categoria_id: 3, monto: 7, fecha: '2026-10-04' },
  ]
  assert.deepEqual(categoryUsage(cats, gastos, '2026-10'), [
    { categoria_id: 1, nombre: 'Comida', icono: '🍕', presupuestado: 100.5, gastado: 35 },
    { categoria_id: 2, nombre: 'Ocio', icono: undefined, presupuestado: 0, gastado: 0 },
  ])
})
