const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
require('./helpers/register-ts.cjs')
function plan(overrides = {}) {
  const file = require('node:path').resolve(__dirname, '../src/lib/month-planning.ts')
  assert.ok(fs.existsSync(file), 'Falta implementar la planificación mensual')
  return require(file).buildMonthPlan({ today: '2026-10-02', budget: 1000, expenses: [], rules: [], categories: [], ...overrides })
}
const monthly = { id: 1, descripcion: 'Internet', monto: 50, categoria_id: 1, activo: true, frecuencia: 'mensual', dia_mes: 10, fecha_inicio: '2026-01-01' }
test('subtracts recorded expenses and future commitments; daily guide includes today', () => {
  const p = plan({ expenses: [{ fecha: '2026-10-01', monto: 100 }], rules: [monthly] })
  assert.equal(p.remaining, 900); assert.equal(p.committed, 50); assert.equal(p.available, 850)
  assert.equal(p.daysLeft, 30); assert.equal(p.daily, 28.33)
})
test('does not reserve occurrences already recorded for the same rule and day', () => {
  const p = plan({ expenses: [{ fecha: '2026-10-10', monto: 50, gasto_recurrente_id: 1 }], rules: [monthly] })
  assert.equal(p.committed, 0); assert.equal(p.available, 950)
})
test('lists all weekly occurrences within start/end and excludes inactive rules', () => {
  const p = plan({ rules: [{ ...monthly, frecuencia: 'semanal', dia_semana: 1, fecha_inicio: '2026-10-05', fecha_fin: '2026-10-19' }, { ...monthly, id: 2, activo: false }] })
  assert.deepEqual(p.upcoming.map(x => x.date), ['2026-10-05', '2026-10-12', '2026-10-19']); assert.equal(p.committed, 150)
})
test('uses only strictly future dates, does not pretend overdue generated charges are unpaid', () => {
  assert.equal(plan({ rules: [{ ...monthly, dia_mes: 2 }, { ...monthly, id: 2, dia_mes: 1 }] }).committed, 0)
})
test('handles February and month-end, negative availability and absent/zero budgets', () => {
  assert.equal(plan({ today: '2028-02-29', budget: 0 }).daysLeft, 1)
  assert.equal(plan({ budget: undefined }).available, null)
  assert.equal(plan({ budget: 0 }).available, 0)
  const p = plan({ budget: 25, rules: [monthly] }); assert.equal(p.available, -25); assert.equal(p.daily, 0)
})
test('warns for exceeded/near categories and projected overspend without zero-limit division', () => {
  const p = plan({ expenses: [{ fecha: '2026-10-01', monto: 100, categoria_id: 1 }], categories: [{ id: 1, nombre: 'Comida', presupuestado: 110, gastado: 100 }, { id: 2, nombre: 'Extras', presupuestado: 0, gastado: 10 }] })
  assert.ok(p.alerts.some(a => a.kind === 'near'))
  assert.ok(p.alerts.some(a => a.kind === 'exceeded' && a.category === 'Extras'))
  assert.ok(p.alerts.some(a => a.kind === 'projection'))
})
test('does not reserve consumed dates even when a generated future expense was deleted', () => {
  assert.equal(plan({ rules: [{ ...monthly, ultima_fecha_generada: '2026-10-10' }] }).committed, 0)
})
test('does not forecast occurrences before the persisted scheduling cursor', () => {
  assert.equal(plan({ rules: [{ ...monthly, proxima_fecha: '2026-11-10' }] }).committed, 0)
})
test('ignores other months and keeps currency totals rounded', () => {
  const p = plan({ expenses: [{ fecha: '2026-09-30', monto: 500 }, { fecha: '2026-10-01', monto: 0.1 }, { fecha: '2026-10-02', monto: 0.2 }] })
  assert.equal(p.spent, 0.3); assert.equal(p.available, 999.7)
})
