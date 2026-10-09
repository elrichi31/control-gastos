require('./helpers/register-ts.cjs')
const {test}=require('node:test'),assert=require('node:assert/strict'),Module=require('node:module')
let calls=[],authenticated=true,failTable=null
const rows={presupuesto_mensual:[{id:10,user_id:'a'},{id:20,user_id:'b'}],presupuesto_categoria:[{id:30,presupuesto_mensual_id:10,user_id:'a',categoria_id:1,categoria:[{nombre:'Own'}]},{id:31,presupuesto_mensual_id:10,user_id:'b',categoria_id:2},{id:32,presupuesto_mensual_id:20,user_id:'a',categoria_id:1},{id:33,presupuesto_mensual_id:20,user_id:'b',categoria_id:1}],movimiento_presupuesto:[{id:40,presupuesto_categoria_id:30,user_id:'a'},{id:41,presupuesto_categoria_id:30,user_id:'b'},{id:42,presupuesto_categoria_id:32,user_id:'a'}]}
const db={from(table){const call={table,filters:[]};calls.push(call);const q={select(){return q},eq(k,v){call.filters.push([k,v]);return q},in(k,v){call.filters.push([k,v]);return q},order(){return q},limit(){return q},insert(v){call.insert=v;return q},update(v){call.update=v;return q},delete(){call.deleted=true;return q},single(){return Promise.resolve(result(true))},maybeSingle(){return Promise.resolve(result(true))},then(a,b){return Promise.resolve(result(false)).then(a,b)}};function result(single){if(table===failTable)return {data:null,error:{message:'PRIVATE DATABASE DETAIL'}};const found=call.insert?[{id:99,...call.insert}]:(rows[table]||[]).filter(r=>call.filters.every(([k,v])=>Array.isArray(v)?v.map(String).includes(String(r[k])):String(r[k])===String(v)));return {data:single?(found[0]||null):found,error:null}}return q}}
const load=Module._load
Module._load=function(name,...args){if(name==='@/lib/auth')return {getAuthenticatedSupabaseClient:async()=>authenticated?{error:null,supabase:db,userId:'a'}:{error:Response.json({error:'No autorizado'},{status:401})}};return load.call(this,name,...args)}
const routes=Object.fromEntries(['presupuesto-mensual-detalle','movimientos-categoria','presupuesto-categoria'].map(n=>[n,require('../src/app/api/'+n+'/route.ts')]))
Module._load=load
const request=(route,id)=>new Request('https://fixture.invalid/api/'+route+'?presupuesto_mensual_id='+id)
const post=(route,body)=>new Request('https://fixture.invalid/api/'+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)})
test('budget reads deny foreign/missing parents even when database policies allow all rows',async()=>{
 for(const name of Object.keys(routes))for(const id of [20,999]){calls=[];const response=await routes[name].GET(request(name,id));assert.equal(response.status,404,name);assert.ok(!calls.some(c=>c.table==='movimiento_presupuesto'))}
})
test('owned budgets never include foreign categories or foreign movements',async()=>{
 for(const name of ['presupuesto-mensual-detalle','movimientos-categoria']){const r=await routes[name].GET(request(name,10));assert.equal(r.status,200);const data=await r.json();assert.equal(data.length,1);assert.deepEqual(data[0].movimientos.map(m=>m.id),[40])}
 const r=await routes['presupuesto-categoria'].GET(request('presupuesto-categoria',10));assert.equal((await r.json()).length,1)
})
test('category creation denies foreign parent without any insert',async()=>{
 calls=[];const r=await routes['presupuesto-categoria'].POST(post('presupuesto-categoria',{presupuesto_mensual_id:20,categoria_id:1}));assert.equal(r.status,404);assert.ok(calls.every(c=>!c.insert))
})
test('movement creation denies foreign category and own category linked to foreign month',async()=>{
 for(const id of [33,32,999]){calls=[];const r=await routes['movimientos-categoria'].POST(post('movimientos-categoria',{presupuesto_categoria_id:id,descripcion:'Fixture',monto:10,fecha:'2026-10-01'}));assert.equal(r.status,404);assert.ok(calls.every(c=>!c.insert))}
})
test('valid owned creation preserves contract and ignores client user injection',async()=>{
 for(const [name,body] of [['presupuesto-categoria',{presupuesto_mensual_id:10,categoria_id:1}],['movimientos-categoria',{presupuesto_categoria_id:30,descripcion:'Fixture',monto:10,fecha:'2026-10-01'}]]){calls=[];const r=await routes[name].POST(post(name,{...body,user_id:'b'}));assert.equal(r.status,200);assert.equal((await r.json()).user_id,'a');assert.equal(calls.filter(c=>c.insert).length,1)}
})
test('ownership lookup failure fails closed and does not expose database diagnostics',async()=>{
 failTable='presupuesto_mensual';calls=[]
 try{const r=await routes['presupuesto-categoria'].POST(post('presupuesto-categoria',{presupuesto_mensual_id:10,categoria_id:1}));assert.equal(r.status,500);assert.doesNotMatch(await r.text(),/PRIVATE DATABASE DETAIL/);assert.ok(calls.every(c=>!c.insert))}finally{failTable=null}
})

test('legacy inconsistent parent chains cannot be mutated or deleted',async()=>{
 for(const method of ['PUT','DELETE'])for(const id of [42,41,999]){calls=[];const req=new Request('https://fixture.invalid',{method,headers:{'content-type':'application/json'},body:JSON.stringify({id,descripcion:'Fixture',monto:10,fecha:'2026-10-01'})});const r=await routes['movimientos-categoria'][method](req);assert.equal(r.status,404);assert.ok(calls.every(c=>!c.update&&!c.deleted))}
 for(const id of [32,33,999]){calls=[];const r=await routes['presupuesto-categoria'].DELETE(new Request('https://fixture.invalid?id='+id,{method:'DELETE'}));assert.equal(r.status,404);assert.ok(calls.every(c=>!c.deleted))}
})
test('owned movement edits/deletes and empty category deletes still succeed',async()=>{
 for(const method of ['PUT','DELETE']){calls=[];const r=await routes['movimientos-categoria'][method](new Request('https://fixture.invalid',{method,body:JSON.stringify({id:40,descripcion:'Fixture',monto:10,fecha:'2026-10-01'})}));assert.equal(r.status,200);assert.ok(calls.some(c=>c.update||c.deleted))}
 const parent={id:34,presupuesto_mensual_id:10,user_id:'a'};rows.presupuesto_categoria.push(parent)
 try{const r=await routes['presupuesto-categoria'].DELETE(new Request('https://fixture.invalid?id=34',{method:'DELETE'}));assert.equal(r.status,200);assert.deepEqual(await r.json(),{success:true})}finally{rows.presupuesto_categoria.pop()}
})
test('relationship labels support both object and array forms',async()=>{
 const cat=rows.presupuesto_categoria[0],before=cat.categoria;cat.categoria={nombre:'Own'}
 try{const r=await routes['movimientos-categoria'].GET(request('movimientos-categoria',10));assert.equal((await r.json())[0].categoria_nombre,'Own')}finally{cat.categoria=before}
})
test('query errors after ownership verification also hide SQL diagnostics',async()=>{
 failTable='movimiento_presupuesto'
 try{for(const name of ['presupuesto-mensual-detalle','movimientos-categoria']){const r=await routes[name].GET(request(name,10));assert.equal(r.status,500);assert.doesNotMatch(await r.text(),/PRIVATE DATABASE DETAIL/)}}finally{failTable=null}
})

test('authentication and required parameters fail before any database access',async()=>{
 authenticated=false;calls=[];try{for(const name of Object.keys(routes))assert.equal((await routes[name].GET(request(name,10))).status,401);assert.equal(calls.length,0)}finally{authenticated=true}
 for(const name of Object.keys(routes)){calls=[];assert.equal((await routes[name].GET(new Request('https://fixture.invalid'))).status,400);assert.equal(calls.length,0)}
})
