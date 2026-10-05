const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { PGlite } = require('@electric-sql/pglite')
const { createHash } = require('node:crypto')
const h = s => createHash('sha256').update(s).digest('hex')
const user = '11111111-1111-4111-8111-111111111111', other = '22222222-2222-4222-8222-222222222222'
const client = 'fixture', resource = 'https://fixture.invalid/api/mcp', redirect = 'https://fixture.invalid/callback', challenge = 'c'.repeat(43)
const migration = path.join(__dirname, '../supabase/migrations/20261013_mcp_account_security.sql')
async function setup() {
  const db = new PGlite()
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, encrypted_password text, banned_until timestamptz);
    INSERT INTO auth.users(id, encrypted_password) VALUES ('${user}','old'),('${other}','old');`)
  for (const file of ['20261001_mcp_oauth.sql', '20261004_app_auth_sessions.sql']) {
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations', file), 'utf8'))
  }
  return db
}
async function apply(db) {
  const sql = fs.readFileSync(migration, 'utf8'); await db.exec(sql); await db.exec(sql)
}
async function authorize(db, owner = user, code = 'code') {
  return (await db.query('SELECT public.mcp_create_authorization($1::uuid,$2,$3,$4,$5,$6,$7::text[]) AS result', [owner,client,resource,redirect,challenge,h(code),['expenses:read','expenses:write']])).rows[0].result
}
async function exchange(db, code = 'code') {
  return (await db.query('SELECT public.mcp_exchange_code($1,$2,$3,$4,$5,$6,$7) AS result', [h(code),client,redirect,resource,challenge,h(code+'access'),h(code+'refresh')])).rows[0].result
}
async function verify(db, code = 'code') {
  return (await db.query('SELECT public.mcp_verify_access($1,$2,$3) AS result', [h(code+'access'),client,resource])).rows[0].result
}
async function refresh(db, code = 'code') {
  return (await db.query('SELECT public.mcp_refresh_tokens($1,$2,$3,$4,$5,NULL) AS result', [h(code+'refresh'),client,resource,h(code+'nextaccess'),h(code+'nextrefresh')])).rows[0].result
}
test('account ban/password change revoke MCP access, refresh and pending codes, not another user', async () => {
  for (const change of ["banned_until=now()+interval '1 day'", "encrypted_password='new'"]) {
    const db = await setup()
    try {
      await apply(db)
      await authorize(db); await exchange(db)
      await authorize(db, user, 'pending')
      await authorize(db, other, 'other'); await exchange(db, 'other')
      await db.query(`UPDATE auth.users SET ${change} WHERE id=$1`, [user])
      assert.equal(await verify(db), null, change+' must revoke access')
      assert.equal(await refresh(db), null, change+' must revoke refresh')
      assert.equal(await exchange(db, 'pending'), null, change+' must invalidate pending consent')
      assert.equal((await verify(db, 'other')).user_id, other)
      if (change.startsWith('banned')) {
        assert.equal(await authorize(db, user, 'blocked'), null)
        await db.query('UPDATE auth.users SET banned_until=NULL WHERE id=$1', [user])
        assert.equal(await verify(db), null, 'unblocking must not resurrect an old credential')
      }
      assert.ok(await authorize(db, user, 'new-consent'))
      assert.ok(await exchange(db, 'new-consent'))
    } finally { await db.close() }
  }
})
test('migration immediately disables legacy credentials of already banned accounts', async () => {
  const db = await setup()
  try {
    await authorize(db); await exchange(db)
    await db.query("UPDATE auth.users SET banned_until=now()+interval '1 year' WHERE id=$1", [user])
    await apply(db)
    assert.equal(await verify(db), null)
    assert.equal(await refresh(db), null)
    assert.equal(await authorize(db, user, 'blocked'), null)
  } finally { await db.close() }
})
