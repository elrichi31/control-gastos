require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')
const { parseExpenseListQuery } = require('../src/lib/expense-list-query.ts')
const { fetchExpenses } = require('../src/services/expenses.ts')
let calls = [], authenticated = true, missingTax = false
const db = { from() {
  const call = { filters: [] }; calls.push(call)
  const q = {
    select(columns, options) { call.columns = columns; call.count = options?.count; return q },
    eq(...args) { call.filters.push(['eq', ...args]); return q },
    gte(...args) { call.filters.push(['gte', ...args]); return q },
    lte(...args) { call.filters.push(['lte', ...args]); return q },
    order(...args) { (call.orders ??= []).push(args); return q },
    range(...args) { call.range = args; return q },
    then(resolve, reject) { return Promise.resolve(missingTax && call.columns.includes('impuesto_exterior')
      ? { error: { code: '42703', message: 'column impuesto_exterior does not exist' } }
      : { data: [{ id: 7, monto: 10 }], error: null, count: 81 }).then(resolve, reject) },
  }; return q
} }
const load = Module._load
Module._load = function(name, ...args) {
  if (name === '@/lib/auth') return { getAuthenticatedSupabaseClient: async () => authenticated ? { supabase: db, userId: 'owner' } : { error: Response.json({}, { status: 401 }) } }
  return load.call(this, name, ...args)
}
const { GET } = require('../src/app/api/gastos/route.ts')
Module._load = load

test('pagination validates real calendar dates, inclusive ranges and bounded integers', () => {
  for (const query of ['from=2026-02-30', 'from=2026-02-02&to=2026-01-01', 'page=0', 'page=-1', 'page=1.2', 'limit=501', 'page=999999999999']) assert.throws(() => parseExpenseListQuery(new URLSearchParams(query)))
  assert.equal(parseExpenseListQuery(new URLSearchParams('from=2024-02-29&limit=50&page=2')).offset, 50)
})
test('paged reads retain owner, range, deterministic date/id ordering and tax fallback', async () => {
  calls = []; missingTax = true
  try {
    const response = await GET(new Request('https://fixture.invalid/api/gastos?page=2&limit=50&from=2026-01-01&to=2026-02-01'))
    const body = await response.json()
    assert.equal(response.status, 200); assert.equal(body.total, 81); assert.equal(body.page, 2)
    assert.equal(calls.length, 2)
    for (const call of calls) {
      assert.equal(call.count, 'exact'); assert.deepEqual(call.range, [50,99])
      assert.deepEqual(call.filters, [['eq','user_id','owner'],['gte','fecha','2026-01-01'],['lte','fecha','2026-02-01']])
      assert.deepEqual(call.orders.map(order => order[0]), ['fecha','id'])
    }
  } finally { missingTax = false }
})
test('legacy clients keep an array and malformed or unauthenticated requests never read private rows', async () => {
  calls = []; assert.ok(Array.isArray(await (await GET(new Request('https://fixture.invalid/api/gastos'))).json()))
  assert.equal(calls[0].range, undefined)
  calls = []; assert.equal((await GET(new Request('https://fixture.invalid/api/gastos?limit=999'))).status,400); assert.equal(calls.length,0)
  authenticated = false
  try { assert.equal((await GET(new Request('https://fixture.invalid/api/gastos?page=1'))).status,401); assert.equal(calls.length,0) }
  finally { authenticated = true }
})
test('history for totals and export traverses more than the default 1000-row cap', async () => {
  const original = global.fetch, rows = Array.from({length:1201}, (_,id) => ({id:id+1,monto:1})), pages = []
  try {
    global.fetch = async (url, options) => {
      const params = new URL(url,'https://fixture.invalid').searchParams, page = Number(params.get('page')), limit = Number(params.get('limit'))
      pages.push(page); assert.equal(options.cache,'no-store')
      return Response.json({items:rows.slice((page-1)*limit,page*limit),total:rows.length,page,limit})
    }
    const all = await fetchExpenses(); assert.equal(all.length,1201); assert.equal(all.reduce((sum,row)=>sum+row.monto,0),1201); assert.deepEqual(pages,[1,2,3])
    let count = 0
    global.fetch = async () => Response.json(++count === 1 ? {items:rows.slice(0,500),total:1201,limit:500} : {items:[],total:1201,limit:500})
    await assert.rejects(fetchExpenses(),/historial cambió/)
    count = 0
    global.fetch = async () => Response.json({items:rows.slice(0,500),total:++count === 1 ? 1201 : 1202,limit:500})
    await assert.rejects(fetchExpenses(),/historial cambió/)
  } finally { global.fetch = original }
})
