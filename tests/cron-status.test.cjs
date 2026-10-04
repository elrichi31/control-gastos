require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')
let userId = 'owner', readError = null
const rows = [{ job: 'sync-email', ran_at: '2026-10-04T12:00:00Z', ok: true, detail: { nuevos: 3 } }, { job: 'recurring-expenses', ran_at: '2026-10-04T05:00:00Z', ok: false, detail: {} }]
const supabase = { from: () => ({ select: async () => ({ data: readError ? null : rows, error: readError }) }) }
const load = Module._load
Module._load = function(name, ...args) { if (name === '@/lib/auth') return { getAuthenticatedSupabaseClient: async () => ({ supabase, userId }) }; return load.call(this, name, ...args) }
const { GET } = require('../src/app/api/cron/status/route.ts')
Module._load = load
Object.assign(process.env, { YAHOO_EMAIL: 'x', YAHOO_APP_PASSWORD: 'x', YAHOO_IMPORT_USER_ID: 'owner' })
const read = async () => (await (await GET(new Request('https://fixture.invalid'))).json())

test('cron status shows the email count only to the import owner', async () => {
  userId = 'owner'
  assert.equal((await read()).runs.find(r => r.job === 'sync-email').nuevos, 3)
  userId = 'someone-else'
  const { runs } = await read()
  assert.equal(runs.find(r => r.job === 'sync-email').nuevos, undefined)
  assert.equal(runs.find(r => r.job === 'recurring-expenses').ok, false)
  assert.ok(runs.every(r => !('detail' in r)))
})
test('cron status degrades to empty before the migration is applied', async () => {
  readError = { code: '42P01' }
  try { assert.deepEqual(await read(), { runs: [] }) } finally { readError = null }
})
