require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { findRecurringCandidates, recurringEmailStatus } = require('../src/lib/email-matches.ts')
const rule = (extra = {}) => ({ id: 7, descripcion: 'Netflix', monto: 10, activo: true, frecuencia: 'mensual', dia_mes: 15, fecha_inicio: '2026-01-01', proxima_fecha: '2026-11-15', ultima_fecha_generada: '2026-10-15', ...extra })
const row = (extra = {}) => ({ tipo: 'gasto', descripcion: 'NETFLIX.COM', monto: 12, fecha: '2026-10-16', ...extra })
const expense = { id: 20, gasto_recurrente_id: 7, descripcion: 'Netflix', monto: 10, fecha: '2026-10-15' }
test('calendarios semanal, anual y fin de mes; respeta pausa, límites y cursor', () => {
  const planned = rule({ proxima_fecha: '2026-10-15', ultima_fecha_generada: null })
  assert.equal(findRecurringCandidates(row(), [planned], [])[0].gasto.id, -7)
  for (const extra of [{ activo: false }, { fecha_inicio: '2026-11-01' }, { fecha_fin: '2026-09-30' }, { ultima_fecha_generada: '2026-10-15' }, { proxima_fecha: '2026-11-15' }]) {
    assert.equal(findRecurringCandidates(row(), [{ ...planned, ...extra }], []).length, 0)
  }
  assert.equal(findRecurringCandidates(row({ tipo: 'ingreso' }), [planned], [expense]).length, 0)
  assert.equal(findRecurringCandidates(row({ fecha: '2026-10-19' }), [planned], [expense]).length, 0)
  const monthly = rule({ dia_mes: 31, proxima_fecha: '2028-02-29', fecha_inicio: '2028-01-01', ultima_fecha_generada: null })
  assert.equal(findRecurringCandidates(row({ fecha: '2028-03-01' }), [monthly], [])[0].recurrente.fecha, '2028-02-29')
  const yearly = { ...monthly, frecuencia: 'anual', mes_anual: 2 }
  assert.equal(findRecurringCandidates(row({ fecha: '2028-03-01' }), [yearly], []).length, 1)
  assert.equal(findRecurringCandidates(row({ fecha: '2028-04-01' }), [yearly], []).length, 0)
  const weekly = rule({ frecuencia: 'semanal', dia_semana: 4, proxima_fecha: '2026-10-15', ultima_fecha_generada: null })
  assert.equal(findRecurringCandidates(row(), [weekly], [])[0].recurrente.fecha, '2026-10-15')
})
test('nombre completo, alias, múltiples reglas y precio base con impuestos no producen decisiones automáticas', () => {
  assert.equal(findRecurringCandidates(row({ descripcion: 'NETFLIXISH' }), [rule()], [expense]).length, 0)
  assert.equal(findRecurringCandidates(row({ descripcion: 'Google Youtube' }), [rule({ descripcion: 'Google One' })], [expense]).length, 0)
  const alias = findRecurringCandidates(row({ descripcion: 'Netflix', descripcion_original: 'Transferencia a JUAN' }), [rule()], [expense])
  assert.equal(alias.length, 1)
  assert.equal(findRecurringCandidates(row(), [rule(), rule({ id: 8, proxima_fecha: '2026-10-15', ultima_fecha_generada: null })], [expense]).length, 2)
  const [taxed] = findRecurringCandidates(row({ monto: 15.99 }), [rule({ monto: 19.19, impuesto_exterior: { base: 15.99, selected: ['isd', 'iva_digital'], customRate: '' } })], [expense])
  assert.equal(taxed.recurrente.diferencia, 0)
  assert.equal(taxed.recurrente.total, 19.19)
})

test('servicio del estado por correo distingue deshabilitado de un error de lectura', async () => {
  const { fetchRecurringEmailStatus } = require('../src/services/email-import.ts')
  const original = global.fetch
  try {
    global.fetch = async url => { assert.match(url, /recurrentes=1/); return { ok: true, json: async () => ({ enabled: true, estados: { 7: { estado: 'sin_confirmar', fecha: '2026-10-15' } } }) } }
    assert.equal((await fetchRecurringEmailStatus())[7].estado, 'sin_confirmar')
    global.fetch = async () => ({ ok: true, json: async () => ({ enabled: false }) })
    assert.equal(await fetchRecurringEmailStatus(), null)
    global.fetch = async () => ({ ok: false, json: async () => ({ error: 'Falta migración' }) })
    await assert.rejects(fetchRecurringEmailStatus, /Falta migración/)
  } finally { global.fetch = original }
})

test('indicador explica sin confirmar y enlaza a revisar el correo, sin afirmar impago', () => {
  const React = require('react')
  const { renderToStaticMarkup } = require('react-dom/server')
  const { RecurringEmailIndicator } = require('../src/components/gastos-recurrentes/RecurringEmailIndicator.tsx')
  const html = renderToStaticMarkup(React.createElement(RecurringEmailIndicator, { status: { estado: 'sin_confirmar', fecha: '2026-10-15' } }))
  assert.match(html, /Sin confirmar por correo/)
  assert.match(html, /2026-10-15/)
  assert.match(html, /href="\/gastos-correo"/)
  assert.doesNotMatch(html, /no cobrado|impago/i)
  const confirmed = renderToStaticMarkup(React.createElement(RecurringEmailIndicator, { status: { estado: 'confirmado', fecha: '2026-10-15', monto: 12 } }))
  assert.match(confirmed, /Confirmado por correo/)
  assert.match(confirmed, /12/)
})

test('estado del último vencimiento no arrastra la confirmación del mes anterior ni declara impago', () => {
  const evidence = [{ recurrente_id: 7, fecha_programada: '2026-09-15', fecha: '2026-09-16', monto: 10 }]
  assert.deepEqual(recurringEmailStatus(rule(), evidence, '2026-10-16'), { estado: 'sin_confirmar', fecha: '2026-10-15' })
  evidence.push({ recurrente_id: 7, fecha_programada: '2026-10-15', fecha: '2026-10-16', monto: 12 })
  assert.deepEqual(recurringEmailStatus(rule(), evidence, '2026-10-16'), { estado: 'confirmado', fecha: '2026-10-15', fecha_correo: '2026-10-16', monto: 12 })
  assert.deepEqual(recurringEmailStatus(rule({ fecha_inicio: '2026-11-01' }), evidence, '2026-10-16'), { estado: 'sin_vencimientos', fecha: null })
})

test('recurrente: reconoce un precio distinto por comercio y calendario, sin usar solo el importe', () => {
  const [candidate] = findRecurringCandidates(row(), [rule()], [expense])
  assert.equal(candidate.gasto.id, 20)
  assert.deepEqual(candidate.recurrente, { id: 7, fecha: '2026-10-15', esperado: 10, cobrado: 12, diferencia: 2, total: 12, impuestos: false })
  assert.equal(findRecurringCandidates(row({ descripcion: 'Spotify', monto: 10 }), [rule()], [expense]).length, 0)
})
