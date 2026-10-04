require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createHash } = require('node:crypto')
const config = { origin: 'https://gastos.example', resource: 'https://gastos.example/api/mcp', clientId: 'chatgpt', clientSecret: 's'.repeat(40), redirects: ['https://chatgpt.com/connector_platform/oauth_redirect'] }
const { validateAuthorization, authenticateClient, hashSecret, safeLoginReturn } = require('../src/lib/mcp/security.ts')
const { expenseSchemas, executeExpenseTool } = require('../src/lib/mcp/tools.ts')
const verifier = 'v'.repeat(43)
const challenge = createHash('sha256').update(verifier).digest('base64url')
function params(extra = {}) { return new URLSearchParams({ response_type:'code',client_id:config.clientId,redirect_uri:config.redirects[0],state:'fixture-state',code_challenge:challenge,code_challenge_method:'S256',resource:config.resource,scope:'expenses:read expenses:write',...extra }) }
test('authorization binds exact redirect, client, resource and S256 PKCE',()=>{
  assert.equal(validateAuthorization(params(),config).redirectUri,config.redirects[0])
  for(const extra of [{redirect_uri:'https://evil.example/callback'},{redirect_uri:config.redirects[0]+'?extra=1'},{client_id:'evil'},{resource:'https://evil.example'},{code_challenge_method:'plain'},{scope:'admin'},{response_type:'token'}]) assert.throws(()=>validateAuthorization(params(extra),config))
  const duplicated=params();duplicated.append('client_id','evil');assert.throws(()=>validateAuthorization(duplicated,config))
})
test('OAuth client authentication requires the secret, including Basic credentials',()=>{
  assert.doesNotThrow(()=>authenticateClient(new Request(config.resource,{headers:{authorization:'Basic '+Buffer.from('chatgpt:'+config.clientSecret).toString('base64')}}),new URLSearchParams(),config))
  assert.throws(()=>authenticateClient(new Request(config.resource),new URLSearchParams({client_id:'chatgpt'}),config))
  assert.throws(()=>authenticateClient(new Request(config.resource),new URLSearchParams({client_id:'chatgpt',client_secret:'bad'}),config))
})
test('hashing never stores the raw bearer secret',()=>{assert.equal(hashSecret('secret').length,64);assert.notEqual(hashSecret('secret'),'secret')})
test('login callback accepts only the local OAuth authorization route',()=>{
 assert.equal(safeLoginReturn('/api/mcp/oauth/authorize?state=x'),'/api/mcp/oauth/authorize?state=x')
 for(const url of ['https://evil.example','//evil.example','/api/mcp/oauth/authorize/evil','/dashboard?x=1']) assert.equal(safeLoginReturn(url),'/dashboard')
})
test('expense schema rejects user injection, invalid dates, negative amounts and unconfirmed writes',()=>{
 const valid={descripcion:'Salud fixture',monto:10,fecha:'2026-10-01',categoria_id:44,metodo_pago_id:7,confirmado:true}
 assert.doesNotThrow(()=>expenseSchemas.crear_gasto.parse(valid))
 for(const extra of [{user_id:'other'},{fecha:'2026-02-30'},{monto:-1},{confirmado:false},{monto:Infinity}]) assert.throws(()=>expenseSchemas.crear_gasto.parse({...valid,...extra}))
 assert.throws(()=>expenseSchemas.editar_gasto.parse({id:1,confirmado:true}))
})
function database() {
 const rows=[{id:1,user_id:'owner',descripcion:'Salud',monto:10,fecha:'2026-10-01',categoria_id:44,metodo_pago_id:7,is_recurrent:false},{id:2,user_id:'other',descripcion:'PRIVATE',monto:999,fecha:'2026-10-01'}]
 return {rows,from(table){let filters=[],operation='read',payload; const q={select(){return q},eq(k,v){filters.push(r=>r[k]===v);return q},is(k,v){filters.push(r=>(r[k]??null)===v);return q},gte(){return q},lte(){return q},order(){return q},range(){return q},limit(){return q},maybeSingle(){return Promise.resolve(result(true))},single(){return Promise.resolve(result(true))},insert(p){operation='insert';payload=p;return q},update(p){operation='update';payload=p;return q},delete(){operation='delete';return q},then(resolve,reject){return Promise.resolve(result(false)).then(resolve,reject)}};
 function result(single){if(operation==='insert'){const r={id:3,...payload};rows.push(r);return {data:single?r:[r],error:null}}
 let match=rows.filter(r=>filters.every(f=>f(r)));if(operation==='update')match.forEach(r=>Object.assign(r,payload));if(operation==='delete')match.forEach(r=>rows.splice(rows.indexOf(r),1));return {data:single?(match[0]||null):match,error:null}}
 return q}}
}
test('list, get, edit and delete are restricted to the authenticated owner',async()=>{
 const db=database();const auth={userId:'owner',scopes:['expenses:read','expenses:write']}
 const list=await executeExpenseTool('listar_gastos',{},auth,db);assert.equal(list.gastos.length,1);assert.equal(list.gastos[0].id,1)
 for(const [name,args] of [['obtener_gasto',{id:2}],['editar_gasto',{id:2,descripcion:'HACK',confirmado:true}],['eliminar_gasto',{id:2,confirmado:true}]]) await assert.rejects(()=>executeExpenseTool(name,args,auth,db),/no encontrado/i)
 assert.equal(db.rows.find(r=>r.id===2).descripcion,'PRIVATE')
 await executeExpenseTool('editar_gasto',{id:1,descripcion:'Updated',confirmado:true},auth,db);assert.equal(db.rows[0].descripcion,'Updated')
 await executeExpenseTool('eliminar_gasto',{id:1,confirmado:true},auth,db);assert.equal(db.rows.length,1)
})
test('discovery endpoints bypass login middleware without exposing private data',()=>{
 const fs=require('node:fs'),path=require('node:path')
 const source=fs.readFileSync(path.join(__dirname,'../src/proxy.ts'),'utf8')
 const literal=source.match(/'(\/\(\(\?![^']+)'/)[1]
 const matcher=new RegExp('^'+JSON.parse('"'+literal+'"')+'$')
 for(const url of ['/.well-known/oauth-protected-resource','/.well-known/oauth-authorization-server','/api/mcp']) assert.equal(matcher.test(url),false,url)
 assert.equal(matcher.test('/dashboard'),true)
})
test('MCP fails closed when OAuth configuration is missing',async()=>{
 const {handleMcp}=require('../src/lib/mcp/runtime.ts')
 const saved=process.env.MCP_PUBLIC_ORIGIN;delete process.env.MCP_PUBLIC_ORIGIN
 try { const r=await handleMcp(new Request('https://gastos.example/api/mcp'));assert.equal(r.status,503) } finally { if(saved)process.env.MCP_PUBLIC_ORIGIN=saved }
})
test('creation uses authenticated identity and preserves Salud / Transferencia IDs',async()=>{
 const db=database();const auth={userId:'owner',scopes:['expenses:read','expenses:write']}
 const r=await executeExpenseTool('crear_gasto',{descripcion:'Salud',monto:10,fecha:'2026-10-01',categoria_id:44,metodo_pago_id:7,confirmado:true},auth,db)
 assert.equal(r.gasto.user_id,'owner');assert.equal(r.gasto.categoria_id,44);assert.equal(r.gasto.metodo_pago_id,7)
 await assert.rejects(()=>executeExpenseTool('eliminar_gasto',{id:1,confirmado:true},{...auth,scopes:['expenses:read']},db),/permiso/i)
})
test('resumen_mes matches the dashboard plan and only reads the owner rows',async()=>{
 const tables={
  gasto:[{user_id:'owner',fecha:'2026-10-02',monto:30,categoria_id:44,gasto_recurrente_id:null},{user_id:'owner',fecha:'2026-10-03',monto:20,categoria_id:45,gasto_recurrente_id:null},{user_id:'other',fecha:'2026-10-02',monto:999,categoria_id:44}],
  presupuesto_mensual:[{id:9,user_id:'owner',anio:2026,mes:10,total:300},{id:8,user_id:'other',anio:2026,mes:10,total:1}],
  presupuesto_categoria:[{id:1,user_id:'owner',presupuesto_mensual_id:9,categoria_id:44,categoria:{nombre:'Comida'}}],
  movimiento_presupuesto:[{user_id:'owner',presupuesto_categoria_id:1,monto:35},{user_id:'other',presupuesto_categoria_id:1,monto:500}],
  gasto_recurrente:[{id:5,user_id:'owner',activo:true,descripcion:'Netflix',monto:10,frecuencia:'mensual',dia_mes:20,fecha_inicio:'2026-01-01'}],
 }
 const db={from(t){const f=[];const q={select(){return q},eq(k,v){f.push(r=>r[k]===v);return q},gte(k,v){f.push(r=>r[k]>=v);return q},lt(k,v){f.push(r=>r[k]<v);return q},in(k,v){f.push(r=>v.includes(r[k]));return q},
  maybeSingle(){return Promise.resolve({data:tables[t].filter(r=>f.every(x=>x(r)))[0]||null,error:null})},then(res,rej){return Promise.resolve({data:tables[t].filter(r=>f.every(x=>x(r))),error:null}).then(res,rej)}};return q}}
 const r=await executeExpenseTool('resumen_mes',{hoy:'2026-10-03'},{userId:'owner',scopes:['expenses:read']},db)
 assert.equal(r.spent,50);assert.equal(r.remaining,250);assert.equal(r.committed,10);assert.equal(r.available,240)
 assert.deepEqual(r.categorias,[{id:44,nombre:'Comida',presupuestado:35,gastado:30}])
 assert.ok(r.alerts.some(a=>a.kind==='near'&&a.category==='Comida'))
 const past=await executeExpenseTool('resumen_mes',{hoy:'2026-11-15',mes:'2026-10'},{userId:'owner',scopes:['expenses:read']},db)
 assert.equal(past.committed,0);assert.equal(past.daysLeft,1)
 await assert.rejects(()=>executeExpenseTool('resumen_mes',{hoy:'2026-10-03',mes:'2026-11'},{userId:'owner',scopes:['expenses:read']},db))
 await assert.rejects(()=>executeExpenseTool('resumen_mes',{hoy:'2026-10-03'},{userId:'owner',scopes:[]},db),/permiso/i)
})
test('recurring tools are owner-bound, scope-checked and price the year correctly',async()=>{
 const rules=[{id:1,user_id:'owner',descripcion:'ChatGPT',monto:20,frecuencia:'mensual',activo:true},{id:2,user_id:'owner',descripcion:'Gym',monto:5,frecuencia:'semanal',activo:false},{id:3,user_id:'other',descripcion:'PRIVATE',monto:999,frecuencia:'mensual',activo:true}]
 const prices=[{gasto_recurrente_id:1,user_id:'owner',monto_anterior:18,monto_nuevo:20,cambiado_en:'2026-09-01'}]
 const rpcCalls=[]
 const db={rpc(name,args){rpcCalls.push({name,args});return Promise.resolve(args.p_id===1&&args.p_user_id==='owner'?{data:{omitida:'2026-10-23',proxima_fecha:'2026-11-23'},error:null}:{data:null,error:null})},
  from(t){const f=[];let patch=null;const rows=t==='gasto_recurrente'?rules:prices;const q={select(){return q},eq(k,v){f.push(r=>r[k]===v);return q},order(){return q},limit(){return q},update(p){patch=p;return q},
   maybeSingle(){const m=rows.filter(r=>f.every(x=>x(r)));if(patch)m.forEach(r=>Object.assign(r,patch));return Promise.resolve({data:m[0]||null,error:null})},
   then(res,rej){return Promise.resolve({data:rows.filter(r=>f.every(x=>x(r))),error:null}).then(res,rej)}};return q}}
 const auth={userId:'owner',scopes:['expenses:read','expenses:write']}
 const list=await executeExpenseTool('listar_recurrentes',{},auth,db)
 assert.deepEqual(list.recurrentes.map(r=>r.id),[1,2])
 assert.equal(list.recurrentes[0].costo_anual,240);assert.equal(list.recurrentes[1].costo_anual,260)
 assert.deepEqual(list.recurrentes[0].ultimo_cambio_precio,{antes:18,ahora:20,fecha:'2026-09-01'})
 assert.equal(list.total_anual_activos,240);assert.equal(list.total_mensual_activos,20)
 assert.deepEqual((await executeExpenseTool('saltar_recurrente',{id:1,confirmado:true},auth,db)).salto,{omitida:'2026-10-23',proxima_fecha:'2026-11-23'})
 assert.equal(rpcCalls[0].args.p_user_id,'owner','the user id comes from the token, never from the input')
 await assert.rejects(()=>executeExpenseTool('saltar_recurrente',{id:3,confirmado:true},auth,db),/no encontrado/i)
 await assert.rejects(()=>executeExpenseTool('cambiar_estado_recurrente',{id:3,activo:false,confirmado:true},auth,db),/no encontrado/i)
 assert.equal(rules[2].activo,true)
 await executeExpenseTool('cambiar_estado_recurrente',{id:1,activo:false,confirmado:true},auth,db);assert.equal(rules[0].activo,false)
 await assert.rejects(()=>executeExpenseTool('saltar_recurrente',{id:1,confirmado:true},{...auth,scopes:['expenses:read']},db),/permiso/i)
 assert.throws(()=>expenseSchemas.saltar_recurrente.parse({id:1}))
 assert.throws(()=>expenseSchemas.cambiar_estado_recurrente.parse({id:1,activo:false,confirmado:true,user_id:'other'}))
})
