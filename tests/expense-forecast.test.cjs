require('./helpers/register-ts.cjs')
const test = require('node:test')
const assert = require('node:assert/strict')
const { buildExpenseForecast } = require('../src/lib/expense-forecast.ts')
const expense = (fecha, monto, extra = {}) => ({ fecha, monto, ...extra })

test('no multiplica un recurrente ya pagado y distingue el gasto variable', () => {
  const expenses = [expense('2026-10-01', 1000, { is_recurrent: true }), ...Array.from({ length: 7 }, (_, i) => expense(`2026-10-0${i + 1}`, 10))]
  const result = buildExpenseForecast({ today: '2026-10-08', expenses, rules: [] })
  assert.equal(result.recorded, 1070)
  assert.equal(result.projected, 1310)
  assert.equal(result.variableRemaining, 240)
  assert.equal(result.backtest.length, 0)
  assert.equal(result.status, 'initial')
})

test('descuenta lo registrado hoy y en fechas futuras del variable previsto', () => {
  const expenses = [...Array.from({ length: 7 }, (_, i) => expense(`2026-10-0${i + 1}`, 10)), expense('2026-10-08', 8), expense('2026-10-10', 20)]
  const result = buildExpenseForecast({ today: '2026-10-08', expenses, rules: [] })
  assert.equal(result.recorded, 98)
  assert.equal(result.variableRemaining, 222)
  assert.equal(result.projected, 320)
})

const fullMonth = (month, amount = 10) => {
  const [y, m] = month.split('-').map(Number)
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return Array.from({ length: days }, (_, i) => expense(`${month}-${String(i + 1).padStart(2, '0')}`, amount))
}

test('compara métodos con meses anteriores y mide errores sin usar datos futuros', () => {
  const expenses = [...Array.from({ length: 9 }, (_, i) => fullMonth(`2026-${String(i + 1).padStart(2, '0')}`)).flat(), ...fullMonth('2026-10').slice(0, 7)]
  const result = buildExpenseForecast({ today: '2026-10-08', expenses, rules: [] })
  assert.equal(result.status, 'validated')
  assert.ok(result.backtest.length >= 3)
  assert.equal(result.projected, 310)
  assert.equal(result.errorTypical, 0)
  assert.ok(result.models.every(m => m.mae === 0))
  const altered = expenses.map(e => e.fecha.startsWith('2026-09') ? { ...e, monto: 500 } : e)
  const other = buildExpenseForecast({ today: '2026-10-08', expenses: [...altered, ...fullMonth('2026-11', 900)], rules: [] })
  assert.deepEqual(other.backtest.find(b => b.month === '2026-06').predictions, result.backtest.find(b => b.month === '2026-06').predictions)
  assert.ok(result.backtest.every(b => b.trainingMonths.every(m => m < b.month)))
})

test('no inventa un cierre de cero ni extrapola solo dos días de una cuenta nueva', () => {
  for (const expenses of [[], [expense('2026-10-01', 20)], [expense('2026-10-12', 10)]]) {
    const result = buildExpenseForecast({ today: expenses[0]?.fecha === '2026-10-12' ? '2026-10-14' : '2026-10-03', expenses, rules: [] })
    assert.equal(result.projected, null)
    assert.equal(result.status, 'insufficient')
    assert.equal(result.range, null)
  }
})

test('incluye el recurrente de hoy una sola vez, respeta pausas y conserva el piso conocido', () => {
  const rule = { id: 1, descripcion: 'Alquiler', monto: 500, activo: true, frecuencia: 'mensual', dia_mes: 8, fecha_inicio: '2026-01-01' }
  const expenses = fullMonth('2026-10').slice(0, 7)
  const planned = buildExpenseForecast({ today: '2026-10-08', expenses, rules: [rule, { ...rule, id: 2, activo: false }] })
  assert.equal(planned.committed, 500)
  assert.equal(planned.projected, 810)
  const recorded = buildExpenseForecast({ today: '2026-10-08', expenses: [...expenses, expense('2026-10-08', 500, { gasto_recurrente_id: 1 })], rules: [rule] })
  assert.equal(recorded.committed, 0)
  assert.equal(recorded.projected, 810)
  assert.equal(recorded.points.at(-1).forecast, recorded.projected)
})

test('rechaza fechas imposibles y montos incompletos en vez de mostrar una cifra plausible', () => {
  for (const today of ['2026-02-30', 'bad-date']) assert.throws(() => buildExpenseForecast({ today, expenses: [], rules: [] }), /fecha/i)
  for (const monto of [NaN, Infinity, -10]) assert.throws(() => buildExpenseForecast({ today: '2026-10-08', expenses: [expense('2026-10-01', monto)], rules: [] }), /datos|monto/i)
})

test('compara con el mes anterior y proyecta por categoría sin tocar el modelo', () => {
  const expenses = [...fullMonth('2026-09').map(e => ({ ...e, categoria: 'Comida' })),
    ...fullMonth('2026-10').slice(0, 7).map((e, i) => ({ ...e, categoria: i % 2 ? 'Comida' : 'Transporte' }))]
  const result = buildExpenseForecast({ today: '2026-10-08', expenses, rules: [] })
  assert.deepEqual(result.previous, { month: '2026-09', total: 300 })
  assert.equal(result.points[29].previous, 300)
  assert.equal(result.points[30].previous, null)
  assert.equal(result.dailyAllowance, money((300 - 70) / 24))
  const comida = result.categories.find(c => c.name === 'Comida')
  assert.equal(comida.recorded, 30)
  assert.equal(comida.previous, 300)
  assert.equal(comida.projected, money(30 + 30 / 7 * 24))
})
function money(n) { return Math.round((n + Number.EPSILON) * 100) / 100 }
