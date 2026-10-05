require('./helpers/register-ts.cjs')
const { test } = require('node:test'), assert = require('node:assert/strict'), Module = require('node:module')
let user = 'owner', serviceCreates = 0
const db = { fixture: true }, load = Module._load
Module._load = function(id,...args) {
  if (id === 'next-auth') return { getServerSession: async () => user ? { user: { id: user } } : null }
  if (id === './auth') return { authOptions: {} }
  if (id === '../database/service') return { createServiceClient: () => { serviceCreates++; return db } }
  if (id === './session-registry') return { sessionRegistryEnabled: () => false, authSessionActive: async () => true }
  if (id === './mobile-session') return { verifyMobileSessionToken: token => token === 'valid-mobile' ? { valid: true, payload: { sub: 'mobile-owner' } } : { valid: false, reason: 'invalid' } }
  if (id === '@supabase/supabase-js') return { createClient: () => ({ auth: { getUser: async token => token === 'valid-provider' ? { data: { user: { id: 'provider-owner' } }, error: null } : { data: { user: null }, error: {} } } }) }
  return load.call(this,id,...args)
}
const { getAuthenticatedSupabaseClient } = require('../src/lib/auth/auth-supabase.ts')
Module._load = load
process.env.NEXTAUTH_URL = 'https://fixture.invalid'
function request(method='POST', headers={}, body='{}') { return new Request('http://localhost:3000/api/gastos', { method, headers: { 'content-type': 'application/json', origin: 'https://fixture.invalid', ...headers }, ...(['GET','HEAD'].includes(method) || body === null ? {} : { body }) }) }
test('cookie mutations require the configured exact Origin before creating the service client', async () => {
  for (const method of ['POST','PUT','PATCH','DELETE']) for (const origin of ['', 'null', 'https://evil.invalid', 'https://sub.fixture.invalid', 'http://fixture.invalid', 'https://fixture.invalid.evil.invalid']) {
    serviceCreates = 0
    const r = await getAuthenticatedSupabaseClient(request(method, { origin, 'x-forwarded-host': 'evil.invalid' }))
    assert.equal(r.error?.status, 403, method+' '+origin); assert.equal(serviceCreates, 0)
  }
})
test('all mutations with a body require JSON media type', async () => {
  for (const authorization of ['', 'Bearer valid-mobile', 'Bearer valid-provider']) for (const contentType of ['', 'text/plain', 'application/x-www-form-urlencoded', 'application/json-malicious']) {
    serviceCreates = 0
    const r = await getAuthenticatedSupabaseClient(request('POST', { authorization, 'content-type': contentType }))
    assert.equal(r.error?.status, 415, contentType); assert.equal(serviceCreates, 0)
  }
})
test('valid cookie writes and bodyless deletes survive reverse proxy URLs', async () => {
  for (const method of ['POST','PUT','DELETE']) {
    const r = await getAuthenticatedSupabaseClient(request(method, { 'content-type': 'application/json; charset=UTF-8' }))
    assert.equal(r.error, null); assert.equal(r.userId, 'owner'); assert.equal(r.authSource, 'nextauth')
  }
  assert.equal((await getAuthenticatedSupabaseClient(request('DELETE', { 'content-type': '' }, null))).error, null)
})
test('verified mobile/provider bearer requests do not depend on browser Origin or cookies', async () => {
  for (const [token, owner] of [['valid-mobile','mobile-owner'], ['valid-provider','provider-owner']]) {
    const r = await getAuthenticatedSupabaseClient(request('POST', { authorization: 'Bearer '+token, origin: '' }))
    assert.equal(r.error, null); assert.equal(r.userId, owner)
  }
  serviceCreates = 0
  const invalid = await getAuthenticatedSupabaseClient(request('POST', { authorization: 'Bearer invalid', origin: '' }))
  assert.equal(invalid.error.status, 401); assert.equal(serviceCreates, 0)
})
test('cookie writes fail closed if canonical origin is missing or invalid', async () => {
  for (const value of ['', 'not-a-url', 'https://user:pass@fixture.invalid']) {
    process.env.NEXTAUTH_URL = value
    try { serviceCreates = 0; assert.equal((await getAuthenticatedSupabaseClient(request())).error?.status, 503); assert.equal(serviceCreates, 0) } finally { process.env.NEXTAUTH_URL = 'https://fixture.invalid' }
  }
})
test('reads and anonymous requests retain their existing authentication contract', async () => {
  assert.equal((await getAuthenticatedSupabaseClient(request('GET', { origin: '' }))).error, null)
  user = null
  try { serviceCreates = 0; assert.equal((await getAuthenticatedSupabaseClient(request('POST', { origin: '' }))).error.status, 401); assert.equal(serviceCreates, 0) } finally { user = 'owner' }
})
