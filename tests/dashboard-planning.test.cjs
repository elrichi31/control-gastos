require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const Module = require('node:module')
let denied = false, error = null, queries = []
const db = { from(table) {
  const ops = []; queries.push({ table, ops })
  const q = {}; for (const method of ['select','eq','gte','lt','not']) q[method] = (...args) => { ops.push([method,...args]); return q }
  q.then = resolve => Promise.resolve({ data: table === 'gasto' ? [{ id: 9, gasto_recurrente_id: 1 }] : [], error }).then(resolve)
  return q
} }
function route() {
  const file = require('node:path').resolve(__dirname, '../src/app/api/dashboard/recurring-plan/route.ts')
  assert.ok(fs.existsSync(file), 'Falta endpoint privado de planificación')
  const original = Module._load
  Module._load = function(name,...args) { if (name === '@/lib/auth/auth-supabase') return { getAuthenticatedSupabaseClient: async () => denied ? { error: new Response(null, {status:401}) } : { supabase: db, userId: 'owner' } }; return original.call(this,name,...args) }
  try { return require(file) } finally { Module._load = original }
}
const req = month => new Request(`https://fixture.invalid/api/dashboard/recurring-plan?month=${month}`)
test('planning endpoint rejects unauthenticated requests before reading data', async () => {
  queries = []; denied = true
  assert.equal((await route().GET(req('2026-10'))).status,401); assert.equal(queries.length,0); denied = false
})
test('planning reads only owner data, bounds links to month and disables HTTP caching', async () => {
  queries = []; const response = await route().GET(req('2026-12'))
  assert.equal(response.status,200); assert.equal(response.headers.get('cache-control'),'no-store')
  assert.deepEqual(await response.json(), { rules: [], links: [{ id:9, gasto_recurrente_id:1 }] })
  for (const q of queries) assert.ok(q.ops.some(op => JSON.stringify(op) === JSON.stringify(['eq','user_id','owner'])))
  assert.ok(queries[1].ops.some(op => op[0] === 'lt' && op[2] === '2027-01-01'))
})
test('planning rejects invalid month and surfaces migration errors without leaking details', async () => {
  queries = []; assert.equal((await route().GET(req('2026-13'))).status,400); assert.equal(queries.length,0)
  error = { code: '42703', message: 'private detail' }
  const r = await route().GET(req('2026-10')); assert.equal(r.status,503); assert.doesNotMatch(await r.text(),/private detail/); error = null
})
test('planning panel renders amounts, future charges and actionable alerts', () => {
  const file = require('node:path').resolve(__dirname, '../src/components/dashboard/MonthPlanning.tsx')
  assert.ok(fs.existsSync(file), 'Falta panel de planificación')
  const React = require('react'); const { renderToStaticMarkup } = require('react-dom/server')
  const { MonthPlanning } = require(file)
  const p = require('../src/lib/month-planning.ts').buildMonthPlan({ today:'2026-10-02',budget:100,rules:[{ id:1,descripcion:'Internet',monto:50,activo:true,frecuencia:'mensual',dia_mes:10,fecha_inicio:'2026-01-01' }],expenses:[],categories:[] })
  const html = renderToStaticMarkup(React.createElement(MonthPlanning,{ plan:p, loading:false, error:null }))
  assert.match(html,/Disponible después de compromisos/); assert.match(html,/Internet/); assert.match(html,/2026-10-10/); assert.match(html,/orientativo/)
  const failed = renderToStaticMarkup(React.createElement(MonthPlanning,{ plan:p,loading:false,error:'No se pudo cargar',onRetry:()=>{} }))
  assert.match(failed,/Reintentar/); assert.doesNotMatch(failed,/Internet/)
  const loading = renderToStaticMarkup(React.createElement(MonthPlanning,{ plan:p,loading:true,error:null }))
  assert.match(loading,/Cargando/); assert.doesNotMatch(loading,/Internet/)
})
