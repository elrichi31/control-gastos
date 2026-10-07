require('./helpers/register-ts.cjs')
const test = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')
let db, authError = null
const original = Module._load
Module._load = function(request, ...args) {
  if (request === '@/lib/auth') return { getAuthenticatedSupabaseClient: async () => ({ supabase: db, userId: 'owner', error: authError }) }
  return original.call(this, request, ...args)
}
const { GET } = require('../src/app/api/estadisticas/proyeccion/route.ts')
Module._load = original
function fakeDb(tables, failPage = false) {
  const queries = []
  return { queries, from(table) {
    let filters = [], from = 0, to = 499
    const q = {
      select(fields) { queries.push({ table, fields, filters }); return q },
      eq(k, v) { filters.push([k, '=', v]); return q },
      gte(k, v) { filters.push([k, '>=', v]); return q },
      lt(k, v) { filters.push([k, '<', v]); return q },
      order() { return q }, range(a, b) { from = a; to = b; return q },
      then(resolve, reject) {
        const rows = (tables[table] || []).filter(r => filters.every(([k, op, v]) => op === '=' ? r[k] === v : op === '>=' ? r[k] >= v : r[k] < v))
        return Promise.resolve({ data: rows.slice(from, to + 1), error: failPage && from >= 500 ? { code: 'fixture' } : null }).then(resolve, reject)
      },
    }
    return q
  } }
}
const request = today => new Request(`https://fixture.invalid/api/estadisticas/proyeccion?today=${today}`)
test('lee más de mil movimientos sin truncar, acota fechas y exige el dueño en ambas tablas', async () => {
  const expenses = Array.from({ length: 1001 }, (_, i) => ({ id: i + 1, user_id: 'owner', monto: 10, fecha: '2026-10-01', is_recurrent: true }))
  db = fakeDb({ gasto: [...expenses, { id: 2000, user_id: 'other', monto: 5000, fecha: '2026-10-01' }, { id: 2001, user_id: 'owner', monto: 5000, fecha: '2026-11-01' }], gasto_recurrente: [] })
  const response = await GET(request('2026-10-08'))
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const body = await response.json()
  assert.equal(body.recorded, 10010)
  assert.ok(db.queries.every(q => q.filters.some(([k, op, v]) => k === 'user_id' && v === 'owner')))
  assert.ok(db.queries.find(q => q.table === 'gasto').fields.includes('gasto_recurrente_id'))
})
test('rechaza fechas inválidas, errores de páginas posteriores y usuarios no autenticados', async () => {
  db = fakeDb({})
  assert.equal((await GET(request('2026-02-30'))).status, 400)
  db = fakeDb({ gasto: Array.from({ length: 501 }, (_, id) => ({ id, user_id: 'owner', fecha: '2026-10-01', monto: 10 })) }, true)
  const failed = await GET(request('2026-10-08'))
  assert.equal(failed.status, 500)
  assert.equal((await failed.json()).projected, undefined)
  authError = new Response('{}', { status: 401 })
  assert.equal((await GET(request('2026-10-08'))).status, 401)
  authError = null
})
