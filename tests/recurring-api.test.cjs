require('./helpers/register-ts.cjs')
const { test }=require('node:test')
const assert=require('node:assert/strict')
const Module=require('node:module')
const user='11111111-1111-4111-8111-111111111111'
const existing={id:7,user_id:user,descripcion:'Internet',monto:30,categoria_id:1,metodo_pago_id:1,frecuencia:'mensual',dia_mes:1,dia_semana:null,fecha_inicio:'2099-01-01',fecha_fin:null,activo:true,proxima_fecha:'2099-01-01',ultima_fecha_generada:null}
let calls=[], auth=true, link=7, dbError=null, instanceLinks=[7]
const db={from(table){const call={table,filters:[]};calls.push(call);const result=()=>({data:table==='gasto'?{id:1,user_id:user,gasto_recurrente_id:link}:table==='gasto_recurrente_instancia'?instanceLinks.map(id=>({gasto_recurrente_id:id})):{...existing,...call.insert,...call.update},error:dbError});const q={select(){return q},eq(...v){call.filters.push(v);return q},insert(v){call.insert=v;return q},update(v){call.update=v;return q},delete(){call.delete=true;return q},then(resolve,reject){return Promise.resolve(result()).then(resolve,reject)},single(){const r=result();if(table==='gasto_recurrente_instancia'){if(r.data.length!==1)return Promise.resolve({data:null,error:{code:'PGRST116'}});r.data=r.data[0]}return Promise.resolve(r)}};return q}}
const load=Module._load
Module._load=function(name,...args){if(name==='@/lib/auth/auth-supabase')return {getAuthenticatedSupabaseClient:async()=>auth?{error:null,supabase:db,userId:user}:{error:Response.json({error:'No autorizado'},{status:401})}};return load.call(this,name,...args)}
const {POST}=require('../src/app/api/gastos-recurrentes/route.ts')
const {PUT,DELETE}=require('../src/app/api/gastos-recurrentes/[id]/route.ts')
const {GET}=require('../src/app/api/gastos/[id]/recurring-info/route.ts')
Module._load=load
const request=(body,method='POST')=>new Request('https://fixture.invalid/api/gastos-recurrentes',{method,body:JSON.stringify(body),headers:{'content-type':'application/json'}})
const params={params:Promise.resolve({id:'7'})}
test('creation stores only an owned rule, never creates an expense or an instance',async()=>{
  calls=[]
  const response=await POST(request(existing));assert.equal(response.status,201)
  assert.deepEqual(calls.map(c=>c.table),['gasto_recurrente'])
  assert.equal(calls[0].insert.user_id,user)
  assert.ok(Object.hasOwn(calls[0].insert,'proxima_fecha'),'Creation must fail closed before the migration')
  const body=await response.json()
  assert.ok(!Object.hasOwn(body,'proxima_fecha') && !Object.hasOwn(body,'ultima_fecha_generada'),'El contrato público de mobile no debe exponer estado interno nuevo')
})
test('create/update validate frequency, dates, amounts and day ranges without writes',async()=>{
  for(const invalid of [{frecuencia:'diaria'},{dia_mes:31},{monto:-1},{fecha_inicio:'2099-02-30'},{fecha_fin:'2000-01-01'},{activo:'false'}]) {
    calls=[];assert.equal((await POST(request({...existing,...invalid}))).status,400)
    assert.ok(calls.every(c=>!c.insert))
    calls=[];assert.equal((await PUT(request(invalid,'PUT'),params)).status,400)
    assert.ok(calls.every(c=>!c.update))
  }
})
test('editing preserves server-owned schedule state and enforces owner filters',async()=>{
  calls=[]
  assert.equal((await PUT(request({monto:45,proxima_fecha:'2000-01-01',ultima_fecha_generada:'2000-01-01',user_id:'other'},'PUT'),params)).status,200)
  assert.deepEqual(calls[1].update,{monto:45})
  assert.ok(calls.every(c=>c.filters.some(([key,value])=>key==='user_id'&&value===user)))
})
test('recurring-info resolves new direct links and legacy duplicates with ownership checks',async()=>{
  calls=[];link=7
  assert.equal((await (await GET(new Request('https://fixture.invalid'),params)).json()).gasto_recurrente_id,7)
  assert.equal(calls[0].table,'gasto');assert.ok(calls[0].filters.some(([key,value])=>key==='user_id'&&value===user))
  assert.ok(!calls.some(c=>c.table==='gasto_recurrente_instancia'))
  calls=[];link=null
  assert.equal((await (await GET(new Request('https://fixture.invalid'),params)).json()).gasto_recurrente_id,7)
  assert.ok(calls.some(c=>c.table==='gasto_recurrente_instancia'))
  link=7
})
test('deletion preserves success response and owner checks',async()=>{
  calls=[]
  const response=await DELETE(new Request('https://fixture.invalid',{method:'DELETE'}),params)
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{success:true})
  assert.ok(calls.every(c=>c.filters.some(([key,value])=>key==='user_id'&&value===user)))
})
test('legacy repeated instances resolve one distinct rule, not ambiguous links',async()=>{
  link=null;instanceLinks=[7,7];calls=[]
  assert.equal((await (await GET(new Request('https://fixture.invalid'),params)).json()).gasto_recurrente_id,7)
  instanceLinks=[7,8]
  assert.equal((await (await GET(new Request('https://fixture.invalid'),params)).json()).gasto_recurrente_id,null)
  link=7;instanceLinks=[7]
})
test('unauthenticated creation does not access DB; missing migration gives a safe 503',async()=>{
  calls=[];auth=false
  assert.equal((await POST(request(existing))).status,401);assert.equal(calls.length,0)
  auth=true;dbError={code:'PGRST204',message:'private fixture error'}
  const response=await POST(request(existing));assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/private fixture error/)
  dbError=null
})
