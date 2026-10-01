require('./helpers/register-ts.cjs')
const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path')
const {createHash}=require('node:crypto')
const {PGlite}=require('@electric-sql/pglite')
const {createOAuthHandlers}=require('../src/lib/mcp/oauth.ts')
const {createMcpHandler}=require('../src/lib/mcp/http.ts')
const config={origin:'https://gastos.example',resource:'https://gastos.example/api/mcp',clientId:'chatgpt',clientSecret:'s'.repeat(40),redirects:['https://chatgpt.com/connector_platform/oauth_redirect']}
const user='11111111-1111-4111-8111-111111111111',verifier='v'.repeat(43)
const challenge=createHash('sha256').update(verifier).digest('base64url')
const request=(url,values,extra={})=>new Request(url,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',...extra},body:new URLSearchParams(values)})
test('HTTP OAuth consent + actual PostgreSQL token exchange + real MCP protocol handshake',async()=>{
 const sql=new PGlite()
 try {
 await sql.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid primary key);INSERT INTO auth.users VALUES('${user}');`)
 await sql.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations/20261001_mcp_oauth.sql'),'utf8'))
 let queries=0
 const db={rpc:async(name,params)=>{const keys=Object.keys(params);try{const r=await sql.query('SELECT public.'+name+'('+keys.map((k,i)=>'$'+(i+1)+(k==='p_scopes'?'::text[]':'')).join(',')+') AS result',Object.values(params));return {data:r.rows[0].result,error:null}}catch(e){return {data:null,error:e}}},from(){queries++;const q={select(){return q},eq(){return q},order(){return q},range(){return q},then(resolve){return Promise.resolve({data:[],error:null}).then(resolve)}};return q}}
 let session={user:{id:user,email:'fixture@example.test'}}
 const oauth=createOAuthHandlers(config,db,async()=>session)
 const mcp=createMcpHandler(config,db)
 const unauth=await mcp(new Request(config.resource,{method:'POST',body:'{}'}));assert.equal(unauth.status,401);assert.match(unauth.headers.get('www-authenticate'),/oauth-protected-resource/);assert.equal(queries,0)
 const proxied=await mcp(new Request('http://127.0.0.1:3006/api/mcp',{headers:{host:'gastos.example'}}));assert.equal(proxied.status,401)
 const badHost=await mcp(new Request(config.resource,{headers:{host:'evil.example'}}));assert.equal(badHost.status,403)
 const params=new URLSearchParams({response_type:'code',client_id:config.clientId,redirect_uri:config.redirects[0],state:'fixture-state',code_challenge:challenge,code_challenge_method:'S256',resource:config.resource,scope:'expenses:read expenses:write'})
 const authorizationUrl=config.origin+'/api/mcp/oauth/authorize?'+params
 session=null
 const login=await oauth.authorizeGet(new Request(authorizationUrl));assert.equal(login.status,303);assert.match(login.headers.get('location'),/auth\/login\?callbackUrl=/)
 session={user:{id:user,email:'fixture@example.test'}}
 const consent=await oauth.authorizeGet(new Request(authorizationUrl));assert.equal(consent.status,200)
 const html=await consent.text();assert.match(html,/Eliminar/);const csrf=html.match(/name="csrf" value="([A-Za-z0-9_-]+)"/)[1]
 const cookie=consent.headers.get('set-cookie').split(';')[0]
 const approve={...Object.fromEntries(params),csrf,decision:'approve'}
 assert.equal((await oauth.authorizePost(request(config.origin+'/api/mcp/oauth/authorize',approve,{origin:'https://evil.example',cookie}))).status,403)
 assert.equal((await oauth.authorizePost(request(config.origin+'/api/mcp/oauth/authorize',{...approve,csrf:'wrong'},{origin:config.origin,cookie}))).status,403)
 const approved=await oauth.authorizePost(request(config.origin+'/api/mcp/oauth/authorize',approve,{origin:config.origin,cookie}));assert.equal(approved.status,303)
 const callback=new URL(approved.headers.get('location'));assert.equal(callback.searchParams.get('state'),'fixture-state');assert.equal(callback.searchParams.get('iss'),config.origin);const code=callback.searchParams.get('code');assert.ok(code)
 const denied=await oauth.authorizePost(request(config.origin+'/api/mcp/oauth/authorize',{...approve,decision:'deny'},{origin:config.origin,cookie}));const denial=new URL(denied.headers.get('location'));assert.equal(denial.searchParams.get('error'),'access_denied');assert.equal(denial.searchParams.get('iss'),config.origin)
 const tokenValues={grant_type:'authorization_code',code,code_verifier:verifier,redirect_uri:config.redirects[0],resource:config.resource,client_id:config.clientId,client_secret:config.clientSecret}
 assert.equal((await oauth.token(request(config.origin+'/api/mcp/oauth/token',{...tokenValues,client_secret:'wrong'}))).status,401)
 assert.equal((await oauth.token(request(config.origin+'/api/mcp/oauth/token',{...tokenValues,code_verifier:'x'.repeat(43)}))).status,400)
 const tokensResponse=await oauth.token(request(config.origin+'/api/mcp/oauth/token',tokenValues));assert.equal(tokensResponse.status,200);const tokens=await tokensResponse.json();assert.ok(tokens.access_token);assert.ok(tokens.refresh_token)
 assert.equal((await oauth.token(request(config.origin+'/api/mcp/oauth/token',tokenValues))).status,400)
 const rpc=async(method,params,id=1,token=tokens.access_token,origin)=>mcp(new Request(config.resource,{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':'2025-06-18',...(origin?{origin}:{})},body:JSON.stringify({jsonrpc:'2.0',id,method,params})}))
 assert.equal((await rpc('tools/list',{},1,'wrong')).status,401)
 assert.equal((await rpc('tools/list',{},1,tokens.access_token,'https://evil.example')).status,403)
 const init=await rpc('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'test-client',version:'1'}});assert.equal(init.status,200);assert.equal((await init.json()).result.serverInfo.name,'bethaspend')
 const listed=await rpc('tools/list',{},2);const tools=(await listed.json()).result.tools;assert.equal(tools.length,7);assert.ok(tools.find(t=>t.name==='eliminar_gasto').annotations.destructiveHint)
 const called=await rpc('tools/call',{name:'listar_gastos',arguments:{}},3);assert.deepEqual(JSON.parse((await called.json()).result.content[0].text).gastos,[])
 const invalid=await rpc('tools/call',{name:'crear_gasto',arguments:{user_id:'other'}},4);assert.ok((await invalid.json()).result.isError)
 const revoked=await oauth.revoke(request(config.origin+'/api/mcp/oauth/revoke',{token:tokens.refresh_token,client_id:config.clientId,client_secret:config.clientSecret}));assert.equal(revoked.status,200)
 assert.equal((await rpc('tools/list',{},5)).status,401)
 } finally {await sql.close()}
})

test('OAuth HTML forms preserve same-origin POSTs without weakening CSRF',async()=>{
 let writes=0
 const db={rpc:async()=>{writes++;return {data:null,error:null}},from(){const q={select(){return q},eq(){return q},in(){return q},is(){return q},gt(){return q},order(){return q},limit(){return Promise.resolve({data:[],error:null})}};return q}}
 const oauth=createOAuthHandlers(config,db,async()=>({user:{id:user,email:'fixture@example.test'}}))
 const params=new URLSearchParams({response_type:'code',client_id:config.clientId,redirect_uri:config.redirects[0],state:'fixture-state',code_challenge:challenge,code_challenge_method:'S256',resource:config.resource,scope:'expenses:read'})
 const consent=await oauth.authorizeGet(new Request(config.origin+'/api/mcp/oauth/authorize?'+params))
 assert.equal(consent.headers.get('referrer-policy'),'same-origin','No-referrer makes browser form POSTs send Origin: null')
 const connections=await oauth.connectionsGet(new Request(config.origin+'/api/mcp/connections'))
 assert.equal(connections.headers.get('referrer-policy'),'same-origin')
 const html=await consent.text(),csrf=html.match(/name="csrf" value="([A-Za-z0-9_-]+)"/)[1],cookie=consent.headers.get('set-cookie').split(';')[0]
 const values={...Object.fromEntries(params),csrf,decision:'approve'},url=config.origin+'/api/mcp/oauth/authorize'
 for(const headers of [{origin:'null',cookie},{cookie},{origin:'https://evil.example',cookie},{origin:config.origin}]){
  assert.equal((await oauth.authorizePost(request(url,values,headers))).status,403)
 }
 assert.equal((await oauth.authorizePost(request(url,{...values,csrf:'wrong'},{origin:config.origin,cookie}))).status,403)
 assert.equal(writes,0)
 assert.equal((await oauth.authorizePost(request(url,values,{origin:config.origin,cookie}))).status,303)
 assert.equal(writes,1)
})
