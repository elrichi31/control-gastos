require('./helpers/register-ts.cjs')
const {test}=require('node:test')
const assert=require('node:assert/strict')
const {generateKeyPair,exportJWK,SignJWT}=require('jose')
const {createHash}=require('node:crypto')
const {PGlite}=require('@electric-sql/pglite')
const fs=require('node:fs'),path=require('node:path')
const CLIENT='https://chatgpt.com/oauth/client.json',CALLBACK='https://chatgpt.com/connector_platform_oauth_redirect',JWKS='https://chatgpt.com/oauth/jwks.json'
const config={origin:'https://gastos.example',resource:'https://gastos.example/api/mcp',clientId:'legacy',clientSecret:'s'.repeat(40),redirects:[CALLBACK]}
const user='11111111-1111-4111-8111-111111111111',verifier='v'.repeat(43)
const form=(values,headers={})=>new Request(config.origin+'/api/mcp/oauth/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',...headers},body:new URLSearchParams(values)})
async function withEnv(values,fn){const keys=['MCP_PUBLIC_ORIGIN','MCP_CLIENT_ID','MCP_CLIENT_SECRET','MCP_REDIRECT_URIS'],saved=keys.map(k=>process.env[k]);try{for(const k of keys){if(values[k]===undefined)delete process.env[k];else process.env[k]=values[k]}return await fn()}finally{keys.forEach((k,i)=>{if(saved[i]===undefined)delete process.env[k];else process.env[k]=saved[i]})}}
async function fixture(metadataOverrides={}){
 const {createCimdClient}=require('../src/lib/mcp/cimd.ts')
 const {publicKey,privateKey}=await generateKeyPair('RS256',{modulusLength:2048})
 const jwk={...await exportJWK(publicKey),kid:'fixture-key',alg:'RS256',use:'sig'}
 const metadata={client_id:CLIENT,redirect_uris:[CALLBACK],token_endpoint_auth_methods_supported:['none','private_key_jwt'],token_endpoint_auth_method:'private_key_jwt',token_endpoint_auth_signing_alg:'RS256',jwks_uri:JWKS,...metadataOverrides}
 const urls=[]
 const client=createCimdClient(async(url,options)=>{urls.push(String(url));assert.equal(options.redirect,'error');return Response.json(String(url)===CLIENT?metadata:{keys:[jwk]})})
 const sign=async(overrides={},key=privateKey)=>new SignJWT({iss:CLIENT,sub:CLIENT,aud:config.origin+'/api/mcp/oauth/token',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+120,jti:require('node:crypto').randomUUID(),...overrides}).setProtectedHeader({alg:'RS256',kid:'fixture-key'}).sign(key)
 const values=async(overrides={})=>({client_id:CLIENT,client_assertion_type:'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',client_assertion:await sign(overrides)})
 return {client,sign,values,urls,privateKey,metadata}
}
test('discovery advertises automatic CIMD and signed client authentication',async()=>{
 await withEnv({MCP_PUBLIC_ORIGIN:config.origin,MCP_CLIENT_ID:config.clientId,MCP_CLIENT_SECRET:config.clientSecret,MCP_REDIRECT_URIS:CALLBACK},async()=>{
  const response=await require('../src/app/.well-known/oauth-authorization-server/route.ts').GET()
  assert.equal(response.status,200);const data=await response.json()
  assert.equal(data.client_id_metadata_document_supported,true)
  assert.ok(data.token_endpoint_auth_methods_supported.includes('private_key_jwt'))
  assert.equal(data.token_endpoint_auth_methods_supported.includes('none'),false)
  assert.deepEqual(data.token_endpoint_auth_signing_alg_values_supported,['RS256'])
 })
})
test('CIMD-only server configuration does not require a manual ID or secret',async()=>{
 await withEnv({MCP_PUBLIC_ORIGIN:config.origin},async()=>{
  const c=require('../src/lib/mcp/security.ts').getMcpConfig();assert.equal(c.clientId,CLIENT);assert.equal(c.clientSecret,'');assert.deepEqual(c.redirects,[CALLBACK])
  const data=await (await require('../src/app/.well-known/oauth-authorization-server/route.ts').GET()).json();assert.deepEqual(data.token_endpoint_auth_methods_supported,['private_key_jwt'])
 })
})
test('CIMD resolves only the trusted document and exact ChatGPT callback',async()=>{
 const f=await fixture(),c=await f.client.resolve(CLIENT,config)
 assert.equal(c.clientId,CLIENT);assert.deepEqual(c.redirects,[CALLBACK]);assert.equal(c.clientSecret,'')
 await f.client.resolve(CLIENT,config);assert.deepEqual(f.urls,[CLIENT])
 for(const id of ['https://evil.example/client.json',CLIENT+'?x=1',CLIENT+'#x','http://127.0.0.1/client.json'])await assert.rejects(()=>f.client.resolve(id,config))
 assert.deepEqual(f.urls,[CLIENT])
 for(const overrides of [{client_id:'https://evil.example'},{redirect_uris:['https://evil.example/callback']},{jwks_uri:'http://127.0.0.1/keys'},{token_endpoint_auth_methods_supported:['none']},{token_endpoint_auth_signing_alg:'HS256'}])await assert.rejects(async()=>{const bad=await fixture(overrides);await bad.client.resolve(CLIENT,config)})
})
test('CIMD fetches fail closed on oversized, redirected and unavailable documents',async()=>{
 const {createCimdClient}=require('../src/lib/mcp/cimd.ts')
 for(const response of [new Response('x'.repeat(17000)),new Response('{}',{status:302}),new Response('{}',{status:503})]){
  const client=createCimdClient(async()=>response);await assert.rejects(()=>client.resolve(CLIENT,config))
 }
})
test('signed client assertions are verified and consumed before issuing tokens',async()=>{
 const f=await fixture();let consumed=0;const seen=new Set()
 const consume=async(id,jti,expires)=>{assert.equal(id,CLIENT);assert.match(jti,/^[a-f0-9]{64}$/);assert.ok(expires>Date.now()/1000);consumed++;if(seen.has(jti))return false;seen.add(jti);return true}
 const values=await f.values(),p=new URLSearchParams(values)
 const c=await f.client.authenticate(form(values),p,config,consume);assert.equal(c.clientId,CLIENT);assert.equal(consumed,1)
 await assert.rejects(()=>f.client.authenticate(form(values),p,config,consume),/Cliente inválido/)
 assert.equal(consumed,2)
})
test('invalid signatures, claims and mixed authentication never consume an assertion',async()=>{
 const f=await fixture();let consumed=0;const consume=async()=>{consumed++;return true}
 const now=Math.floor(Date.now()/1000)
 for(const claims of [{iss:'evil'},{sub:'evil'},{aud:'https://evil.example'},{exp:now-30},{exp:now+3600},{jti:''},{jti:null},{nbf:now+300}]){
  const values=await f.values(claims);await assert.rejects(()=>f.client.authenticate(form(values),new URLSearchParams(values),config,consume))
 }
 const other=await generateKeyPair('RS256'),wrong={...(await f.values()),client_assertion:await f.sign({},other.privateKey)}
 const good=await f.values()
 for(const values of [wrong,{...good,client_secret:'injected'},{...good,client_assertion_type:'wrong'},{client_id:CLIENT}])await assert.rejects(()=>f.client.authenticate(form(values),new URLSearchParams(values),config,consume))
 await assert.rejects(()=>f.client.authenticate(form(good,{authorization:'Basic abc'}),new URLSearchParams(good),config,consume))
 const duplicate=new URLSearchParams(good);duplicate.append('client_id',CLIENT);await assert.rejects(()=>f.client.authenticate(form(good),duplicate,config,consume))
 const legacy={client_id:config.clientId,client_secret:config.clientSecret};assert.equal((await f.client.authenticate(form(legacy),new URLSearchParams(legacy),config,consume)).clientId,config.clientId)
 assert.equal(consumed,0)
})
test('CIMD consent, signed code exchange, refresh, revocation and MCP use real PostgreSQL',async()=>{
 const sql=new PGlite()
 try{
  await sql.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid primary key);INSERT INTO auth.users VALUES('${user}');`)
  for(const name of ['20261001_mcp_oauth.sql','20261002_mcp_cimd_assertions.sql'])await sql.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations',name),'utf8'))
  const db={rpc:async(name,params)=>{try{const keys=Object.keys(params),r=await sql.query('SELECT public.'+name+'('+keys.map((k,i)=>'$'+(i+1)+(k==='p_scopes'?'::text[]':'')).join(',')+') AS result',Object.values(params));return {data:r.rows[0].result,error:null}}catch(error){return {data:null,error}}}}
  const f=await fixture(),oauth=require('../src/lib/mcp/oauth.ts').createOAuthHandlers(config,db,async()=>({user:{id:user,email:'fixture@example.test'}}),f.client)
  const params=new URLSearchParams({response_type:'code',client_id:CLIENT,redirect_uri:CALLBACK,scope:'expenses:read',resource:config.resource,state:'fixture-state',code_challenge_method:'S256',code_challenge:createHash('sha256').update(verifier).digest('base64url')})
  const consent=await oauth.authorizeGet(new Request(config.origin+'/api/mcp/oauth/authorize?'+params));assert.equal(consent.status,200)
  const csrf=(await consent.text()).match(/name="csrf" value="([A-Za-z0-9_-]+)"/)[1],cookie=consent.headers.get('set-cookie').split(';')[0]
  const approved=await oauth.authorizePost(form({...Object.fromEntries(params),csrf,decision:'approve'},{origin:config.origin,cookie}));assert.equal(approved.status,303)
  const callback=new URL(approved.headers.get('location'));assert.equal(callback.searchParams.get('iss'),config.origin)
  const code=callback.searchParams.get('code'),auth=await f.values(),exchange={...auth,grant_type:'authorization_code',code,code_verifier:verifier,redirect_uri:CALLBACK,resource:config.resource}
  const tokensResponse=await oauth.token(form(exchange));assert.equal(tokensResponse.status,200);const tokens=await tokensResponse.json()
  assert.equal((await oauth.token(form(exchange))).status,401,'assertion replay rejected across requests')
  assert.equal((await oauth.token(form({...exchange,...await f.values()}))).status,400,'authorization code stays single-use')
  const mcp=require('../src/lib/mcp/http.ts').createMcpHandler(config,db)
  const init=()=>mcp(new Request(config.resource,{method:'POST',headers:{authorization:'Bearer '+tokens.access_token,'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'cimd-fixture',version:'1'}}})}))
  assert.equal((await init()).status,200)
  const refreshed=await oauth.token(form({...await f.values(),grant_type:'refresh_token',refresh_token:tokens.refresh_token,resource:config.resource}));assert.equal(refreshed.status,200)
  const next=await refreshed.json();assert.notEqual(next.refresh_token,tokens.refresh_token)
  const revoke=await oauth.revoke(form({...await f.values({aud:config.origin+'/api/mcp/oauth/revoke'}),token:next.refresh_token}));assert.equal(revoke.status,200);assert.equal((await init()).status,401)
  const grants=await sql.query('SELECT client_id FROM public.mcp_oauth_grants');assert.equal(grants.rows[0].client_id,CLIENT)
  const denied=await sql.query("SELECT has_table_privilege('anon','public.mcp_oauth_assertions','SELECT') AS allowed");assert.equal(denied.rows[0].allowed,false)
  const jti='a'.repeat(64),expires=new Date(Date.now()+120000).toISOString()
  const results=await Promise.all([db.rpc('mcp_consume_assertion',{p_client_id:CLIENT,p_jti_hash:jti,p_expires_at:expires}),db.rpc('mcp_consume_assertion',{p_client_id:CLIENT,p_jti_hash:jti,p_expires_at:expires})]);assert.deepEqual(results.map(x=>x.data).sort(),[false,true])
 }finally{await sql.close()}
})
