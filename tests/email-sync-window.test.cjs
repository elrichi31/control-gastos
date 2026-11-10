require('./helpers/register-ts.cjs')
const test = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')

// Sincronizar lee primero lo reciente; "Revisar todo" vuelve a leer desde enero.
const owner = 'owner-uuid'
let lastFecha = null, dbError = null, calls = []
const db = { from: () => { const q = { select: () => q, eq: () => q, order: () => q, limit: () => q,
  maybeSingle: () => Promise.resolve(dbError ? { data: null, error: dbError } : { data: lastFecha ? { fecha: lastFecha } : null, error: null }) }; return q } }
const realLoad = Module._load
Module._load = function (request, ...args) {
  if (request === '@/lib/auth') return { getAuthenticatedSupabaseClient: async () => ({ error: null, supabase: db, userId: owner }) }
  if (request === '@/lib/email-sync') return {
    yahooImportUserId: () => owner, isMissingMigration: () => false,
    syncYahoo: async (_db, userId, since) => { calls.push({ userId, since: since.toISOString().slice(0, 10) }); return { ok: true, nuevos: 0 } },
  }
  return realLoad.call(this, request, ...args)
}
const { POST } = require('../src/app/api/email-import/yahoo/route.ts')
Module._load = realLoad
const post = body => POST(new Request('https://fixture.invalid/api/email-import/yahoo', body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : { method: 'POST' }))
const daysAgo = n => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)

test('sin nada importado, la primera sincronización lee desde enero', async () => {
  calls = []; lastFecha = null; dbError = null
  const res = await post()
  assert.equal(res.status, 200)
  assert.equal(calls[0].since, '2026-01-01')
})

test('con importaciones recientes, lee solo los últimos 14 días', async () => {
  calls = []; lastFecha = daysAgo(1); dbError = null
  const body = await (await post()).json()
  assert.equal(calls[0].since, daysAgo(14))
  assert.equal(body.completo, false)
})

test('si el último movimiento es viejo, retrocede hasta 3 días antes de él', async () => {
  calls = []; lastFecha = daysAgo(40); dbError = null
  await post()
  assert.ok(calls[0].since <= daysAgo(43) && calls[0].since >= daysAgo(44), calls[0].since)
})

test('"Revisar todo" ignora la última fecha y lee desde enero', async () => {
  calls = []; lastFecha = daysAgo(1); dbError = null
  const body = await (await post({ completo: true })).json()
  assert.equal(calls[0].since, '2026-01-01')
  assert.equal(body.completo, true)
})

test('si no se puede leer la última fecha, no sincroniza a ciegas', async () => {
  calls = []; dbError = { code: 'XX000' }
  const res = await post()
  assert.equal(res.status, 500)
  assert.equal(calls.length, 0)
})
