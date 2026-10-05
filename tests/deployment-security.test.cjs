require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')
const fs = require('node:fs')
const path = require('node:path')

test('production image defaults authentication to the public HTTPS origin and secure cookies', () => {
  const dockerfile = fs.readFileSync(path.join(__dirname, '../Dockerfile'), 'utf8')
  const runtime = dockerfile.slice(dockerfile.lastIndexOf('FROM '))
  const match = runtime.match(/NEXTAUTH_URL=(https:\/\/[^\s]+)/)
  assert.ok(match, 'Production image is missing its public HTTPS auth URL')
  assert.equal(match[1], 'https://spend.zenlorlabs.com')
  const cookieFile = path.join(path.dirname(require.resolve('next-auth')), 'core/lib/cookie.js')
  const { defaultCookies } = require(cookieFile)
  const cookies = defaultCookies(new URL(match[1]).protocol === 'https:')
  for (const key of ['sessionToken', 'csrfToken', 'callbackUrl']) {
    assert.equal(cookies[key].options.secure, true)
    assert.equal(cookies[key].options.httpOnly, true)
  }
})
const load = Module._load
Module._load = function (id, ...args) {
  if (id === '@serwist/next') return () => config => config
  return load.call(this, id, ...args)
}
const config = require('../next.config.ts').default
Module._load = load

test('global security headers protect pages without blocking Next scripts or OAuth forms', async () => {
  const rules = await config.headers()
  const rule = rules.find(r => r.source === '/:path*')
  assert.ok(rule, 'Missing global security headers')
  const headers = Object.fromEntries(rule.headers.map(h => [h.key.toLowerCase(), h.value]))
  assert.equal(headers['x-frame-options'], 'DENY')
  assert.equal(headers['x-content-type-options'], 'nosniff')
  assert.equal(headers['referrer-policy'], 'strict-origin-when-cross-origin')
  assert.match(headers['content-security-policy'], /frame-ancestors 'none'/)
  assert.match(headers['content-security-policy'], /object-src 'none'/)
  assert.doesNotMatch(headers['content-security-policy'], /script-src|form-action/)
  assert.match(headers['content-security-policy-report-only'], /script-src/)
  assert.equal(headers['strict-transport-security'], 'max-age=2592000')
  assert.doesNotMatch(headers['strict-transport-security'], /includeSubDomains|preload/)
  assert.equal(rules.find(r => r.source === '/api/:path*').headers.find(h => h.key === 'Cache-Control').value, 'no-store')
})
