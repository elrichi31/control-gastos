require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { detectSubscriptions } = require('../src/lib/subscription-detector.ts')
const e = (descripcion, monto, fecha, extra = {}) => ({ descripcion, monto, fecha, categoria_id: 3, metodo_pago_id: 2, ...extra })

test('suggests a stable charge seen in 3+ consecutive months that is not tracked yet', () => {
  const out = detectSubscriptions([
    e('Spotify', 5.99, '2026-10-02'), e('spotify ', 5.99, '2026-09-02'), e('Spotify', 6.49, '2026-08-03'),
    e('Netflix', 15, '2026-10-05'), e('Netflix', 15, '2026-09-05'), e('Netflix', 15, '2026-08-05'),
  ], ['NETFLIX'], '2026-10-03')
  assert.deepEqual(out, [{ clave: 'spotify', descripcion: 'Spotify', monto: 5.99, dia_mes: 2, categoria_id: 3, metodo_pago_id: 2, meses: 3 }])
})

test('ignores gaps, unstable amounts, stale series and generated recurring expenses', () => {
  const out = detectSubscriptions([
    e('Gym', 30, '2026-10-01'), e('Gym', 30, '2026-08-01'), e('Gym', 30, '2026-07-01'),           // gap in September
    e('Super', 80, '2026-10-01'), e('Super', 20, '2026-09-01'), e('Super', 55, '2026-08-01'),     // unstable amount
    e('Old', 9, '2026-07-01'), e('Old', 9, '2026-06-01'), e('Old', 9, '2026-05-01'),              // stopped months ago
    e('iCloud', 1, '2026-10-08', { is_recurrent: true }), e('iCloud', 1, '2026-09-08', { is_recurrent: true }), e('iCloud', 1, '2026-08-08', { is_recurrent: true }),
  ], [], '2026-10-03')
  assert.deepEqual(out, [])
})

test('a series that charged last month but not yet this month is still suggested', () => {
  const out = detectSubscriptions([e('Disney', 8, '2026-09-20'), e('Disney', 8, '2026-08-20'), e('Disney', 8, '2026-07-20')], [], '2026-10-03')
  assert.equal(out.length, 1); assert.equal(out[0].dia_mes, 20)
})
