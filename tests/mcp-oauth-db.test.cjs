const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { PGlite } = require('@electric-sql/pglite')
const { createHash } = require('node:crypto')
const h = s => createHash('sha256').update(s).digest('hex')
const user='11111111-1111-4111-8111-111111111111', client='chatgpt', resource='https://gastos.example/api/mcp', redirect='https://chatgpt.com/callback', challenge='c'.repeat(43)
async function setup() {
 const db=new PGlite()
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid primary key, encrypted_password text, banned_until timestamptz); INSERT INTO auth.users(id) VALUES ('${user}');`)
 await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations/20261001_mcp_oauth.sql'),'utf8'))
 await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations/20261013_mcp_account_security.sql'),'utf8'))
 await db.query('SELECT public.mcp_create_authorization($1::uuid,$2,$3,$4,$5,$6,$7::text[])',[user,client,resource,redirect,challenge,h('code'),['expenses:read','expenses:write']])
 return db
}
async function exchange(db,overrides={}) {
 const p={code:h('code'),client,resource,redirect,challenge,access:h('access'),refresh:h('refresh'),...overrides}
 return (await db.query('SELECT public.mcp_exchange_code($1,$2,$3,$4,$5,$6,$7) AS result',[p.code,p.client,p.redirect,p.resource,p.challenge,p.access,p.refresh])).rows[0].result
}
async function refresh(db,token='refresh',access='access2',next='refresh2',scope=null) {
 return (await db.query('SELECT public.mcp_refresh_tokens($1,$2,$3,$4,$5,$6::text[]) AS result',[h(token),client,resource,h(access),h(next),scope])).rows[0].result
}
async function verify(db,token='access',audience=resource) {
 return (await db.query('SELECT public.mcp_verify_access($1,$2,$3) AS result',[h(token),client,audience])).rows[0].result
}
test('real PostgreSQL: authorization code binding, atomic single use, rotation, replay revocation and rate limit',async()=>{
 const db=await setup()
 try {
  for(const overrides of [{challenge:'wrong'},{client:'other'},{resource:'https://evil.example'},{redirect:'https://evil.example'}]) assert.equal(await exchange(db,overrides),null)
  const results=await Promise.all([exchange(db),exchange(db,{access:h('other-access'),refresh:h('other-refresh')})])
  assert.equal(results.filter(Boolean).length,1)
  assert.equal((await verify(db)).user_id,user)
  assert.equal(await verify(db,'access','https://evil.example'),null)
  assert.equal(await verify(db,'wrong'),null)
  assert.equal(await refresh(db,'refresh','badaccess','badrefresh',['admin']),null)
  assert.ok(await refresh(db))
  assert.ok(await verify(db,'access2'))
  assert.equal(await refresh(db),null)
  assert.equal(await verify(db,'access2'),null)
  assert.equal(await verify(db),null)
  assert.equal((await db.query('SELECT count(*)::int AS n FROM public.mcp_oauth_tokens WHERE token_hash=$1',[h('badaccess')])).rows[0].n,0)
 } finally {await db.close()}
})
test('real PostgreSQL: expired credentials, explicit revocation, anon cannot read tokens, distributed rate limiting',async()=>{
 const db=await setup()
 try {
  await exchange(db)
  await db.query("UPDATE public.mcp_oauth_tokens SET expires_at=now()-interval '1 second' WHERE kind='access'")
  assert.equal(await verify(db),null)
  await db.query("UPDATE public.mcp_oauth_tokens SET expires_at=now()+interval '10 minutes' WHERE kind='access'")
  await db.query('UPDATE public.mcp_oauth_grants SET request_count=120,window_start=now()')
  assert.equal((await verify(db)).rate_limited,true)
  await db.query('UPDATE public.mcp_oauth_grants SET window_start=now()-interval \'2 minutes\'')
  assert.equal((await verify(db)).user_id,user)
  await db.query('SELECT public.mcp_revoke_token($1,$2,$3)',[h('refresh'),client,resource])
  assert.equal(await verify(db),null)
  await db.exec('SET ROLE anon')
  await assert.rejects(()=>db.query('SELECT * FROM public.mcp_oauth_tokens'),/permission denied/)
  await assert.rejects(()=>db.query('SELECT public.mcp_verify_access($1,$2,$3)',[h('access'),client,resource]),/permission denied/)
 } finally {await db.close()}
})
