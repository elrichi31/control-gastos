require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')
let writes=0, rpcError=null
const db={rpc:async()=>{writes++;return {data:{created:1,pending:false},error:rpcError}},from(){writes++;const query={select(){return query},eq(){return query},lte(){return query},then(resolve){return Promise.resolve({data:[],error:null}).then(resolve)}};return query}}
const load=Module._load
Module._load=function(name,...args){if(name==='@supabase/supabase-js')return {createClient:()=>db};return load.call(this,name,...args)}
const { GET }=require('../src/app/api/cron/process-recurring-expenses/route.ts')
Module._load=load
process.env.CRON_SECRET='fixture-secret';process.env.NEXT_PUBLIC_SUPABASE_URL='https://fixture.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fixture-private';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='fixture-anon'
const request=authorization=>new Request('https://fixture.invalid/api/cron/process-recurring-expenses',{headers:authorization?{authorization}:{}})
test('cron rejects missing/wrong credentials before database access',async()=>{
  writes=0
  assert.equal((await GET(request())).status,401)
  assert.equal((await GET(request('Bearer wrong'))).status,401)
  assert.equal(writes,0)
})
test('cron fails closed without configuration, executes one RPC and surfaces database errors',async()=>{
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
  assert.equal((await GET(request('Bearer fixture-secret'))).status,503)
  process.env.SUPABASE_SERVICE_ROLE_KEY=key
  writes=0
  const result=await GET(request('Bearer fixture-secret'))
  assert.equal(result.status,200);assert.equal((await result.json()).created,1);assert.equal(writes,1)
  rpcError={code:'PGRST202',message:'fixture private database details'}
  const missing=await GET(request('Bearer fixture-secret'))
  assert.equal(missing.status,503);assert.doesNotMatch(await missing.text(),/private database details/)
  rpcError={code:'23503',message:'fixture constraint failure'}
  assert.equal((await GET(request('Bearer fixture-secret'))).status,500)
  rpcError=null
})
