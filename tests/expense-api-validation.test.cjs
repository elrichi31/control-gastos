require('./helpers/register-ts.cjs')
const { test } = require('node:test'), assert = require('node:assert/strict'), Module = require('node:module')
let calls = [], authenticated = true
const db = { from(table) {
  const call = { table, filters: [] }; calls.push(call)
  const q = { insert(value) { call.insert = value; return q }, update(value) { call.update = value; return q }, delete() { call.delete = true; return q }, select() { return q }, eq(k,v) { call.filters.push([k,v]); return q }, single: async () => ({ data: { id: 7, ...(call.insert?.[0] || call.update) }, error: null }), then: resolve => resolve({ error: null }) }
  return q
} }
const load = Module._load
Module._load = function(id,...args) { if (id === '@/lib/auth') return { getAuthenticatedSupabaseClient: async () => authenticated ? { error: null, userId: 'owner', supabase: db } : { error: Response.json({ error: 'No autorizado' }, { status: 401 }) } }; return load.call(this,id,...args) }
const routes = require('../src/app/api/gastos/route.ts')
Module._load = load
const valid = { descripcion: 'Compra', monto: 12.34, fecha: '2026-10-05', categoria_id: 1, metodo_pago_id: 2 }
function request(method, body, query = '') { return new Request('https://fixture.invalid/api/gastos'+query, { method, headers: { 'content-type': 'application/json' }, ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}) }) }
test('expense creation and patch reject invalid finance fields before database access', async () => {
  for (const [field, values] of Object.entries({ monto: [-1, 0, '12.34', null, 1.234, 1000000000], descripcion: ['', '   ', 'x'.repeat(501), {}, null], fecha: ['2026-02-30', '2025-02-29', '2026-13-01', '2026-10-05T00:00:00Z', 1], categoria_id: [-1, 0, 1.5, '1', null, {}], metodo_pago_id: [0, '2', null], is_recurrent: ['true', 1, null] })) {
    for (const value of values) for (const method of ['POST', 'PUT']) {
      calls = []
      const r = await routes[method](request(method, method === 'POST' ? { ...valid, [field]: value } : { id: 7, [field]: value }))
      assert.equal(r.status, 400, `${method}: ${field}=${JSON.stringify(value)}`); assert.equal(calls.length, 0)
    }
  }
})
test('malformed JSON and non-object bodies fail with 400 instead of throwing', async () => {
  for (const method of ['POST', 'PUT']) for (const body of ['{', 'null', '[]', '42', '"text"']) {
    calls = []; const r = await routes[method](request(method, body)); assert.equal(r.status, 400); assert.equal(calls.length, 0)
  }
})
test('valid writes preserve response, tags, partial edits and authenticated ownership', async () => {
  calls = []
  const created = await routes.POST(request('POST', { ...valid, descripcion: ' Compra ', is_recurrent: false, tags: ['Casa'], user_id: 'foreign' }))
  assert.equal(created.status, 200); assert.equal((await created.json()).data.user_id, 'owner')
  assert.equal(calls[0].insert[0].descripcion, 'Compra')
  calls = []
  assert.equal((await routes.PUT(request('PUT', { monto: 0.29 }, '?id=7'))).status, 200)
  assert.deepEqual(calls[0].update, { monto: 0.29 }); assert.deepEqual(calls[0].filters, [['id', 7], ['user_id', 'owner']])
  calls = []
  assert.equal((await routes.PUT(request('PUT', { id: 7, tags: [] }))).status, 200)
  assert.deepEqual(calls[0].update, { tags: [] })
})
test('IDs are positive safe integers and a conflicting query/body ID is rejected', async () => {
  for (const id of ['0','-1','1.5','foo','9007199254740992']) for (const method of ['PUT', 'DELETE']) {
    calls = []; const r = await routes[method](request(method, method === 'PUT' ? { monto: 1 } : undefined, '?id='+id)); assert.equal(r.status, 400); assert.equal(calls.length, 0)
  }
  calls = []; assert.equal((await routes.PUT(request('PUT', { id: 8, monto: 1 }, '?id=7'))).status, 400); assert.equal(calls.length, 0)
  calls = []; assert.equal((await routes.DELETE(request('DELETE', undefined, '?id=7'))).status, 200); assert.deepEqual(calls[0].filters, [['id', 7], ['user_id', 'owner']])
})
test('empty patches and invalid authentication cannot reach the database', async () => {
  calls = []; assert.equal((await routes.PUT(request('PUT', { id: 7, user_id: 'foreign' }))).status, 400); assert.equal(calls.length, 0)
  authenticated = false
  try { assert.equal((await routes.POST(request('POST', valid))).status, 401); assert.equal(calls.length, 0) } finally { authenticated = true }
})
