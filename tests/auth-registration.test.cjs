require('./helpers/register-ts.cjs')
const {test}=require('node:test'),assert=require('node:assert/strict'),Module=require('node:module')
Object.assign(process.env,{NEXT_PUBLIC_SUPABASE_URL:'https://provider.invalid',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-public',NEXTAUTH_URL:'https://app.invalid'})
let calls=[],settings={disable_signup:false,mailer_autoconfirm:false},fails=false,signupError=null,instantSession=null
const originalLoad=Module._load
Module._load=function(id,...args){if(id==='@supabase/supabase-js')return{createClient:()=>({auth:{signUp:async(input)=>{calls.push(input);return{data:{user:{id:'11111111-1111-4111-8111-111111111111',email:input.email},session:instantSession},error:signupError}}}})};return originalLoad.call(this,id,...args)}
const {POST}=require('../src/app/api/auth/register/route.ts');Module._load=originalLoad
const {NextRequest}=require('next/server'),originalFetch=global.fetch
const body={firstName:' Ada ',lastName:' Lovelace ',email:'new@example.invalid',password:'synthetic-password'}
function request(value=body){return new NextRequest('https://untrusted.invalid/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:typeof value==='string'?value:JSON.stringify(value)})}
test.beforeEach(()=>{calls=[];settings={disable_signup:false,mailer_autoconfirm:false};fails=false;signupError=null;instantSession=null;global.fetch=async()=>{if(fails)throw Error('provider down');return Response.json(settings)}})
test.after(()=>{global.fetch=originalFetch})
test('public signup creates account and requests email confirmation without exposing tokens',async()=>{const r=await POST(request());assert.equal(r.status,200);const data=await r.json();assert.equal(data.needsEmailConfirmation,true);assert.equal(calls.length,1);assert.equal(calls[0].options.data.full_name,'Ada Lovelace');assert.equal(calls[0].options.emailRedirectTo,'https://app.invalid/auth/login');assert.equal(data.access_token,undefined);assert.equal(r.headers.get('cache-control'),'no-store')})
test('invalid signup fields fail before calling Supabase',async()=>{for(const input of [null,{}, {...body,firstName:'   '},{...body,email:'bad'},{...body,password:3},{...body,password:'short'},'{bad json']){assert.equal((await POST(request(input))).status,400)}assert.equal(calls.length,0)})
test('signup without email confirmation accepts provider session but never exposes tokens',async()=>{settings={disable_signup:false,mailer_autoconfirm:true};instantSession={access_token:'synthetic-token'};const r=await POST(request());assert.equal(r.status,200);const data=await r.json();assert.equal(data.needsEmailConfirmation,false);assert.match(data.message,/iniciar sesión/);assert.doesNotMatch(JSON.stringify(data),/synthetic-token/);assert.equal(calls.length,1)})
test('signup still rejects disabled registration or unknown provider settings',async()=>{for(const value of [{disable_signup:true,mailer_autoconfirm:false},{}]){settings=value;assert.equal((await POST(request())).status,503)}assert.equal(calls.length,0)})
test('provider settings failure does not create an account',async()=>{fails=true;assert.equal((await POST(request())).status,503);assert.equal(calls.length,0)})
test('provider signup error is handled without leaking its internal details',async()=>{signupError={message:'private diagnostic'};const r=await POST(request());assert.equal(r.status,400);assert.doesNotMatch(JSON.stringify(await r.json()),/private diagnostic/)})
test('unexpected immediate provider session never becomes app login or false email-confirmation success',async()=>{instantSession={access_token:'synthetic-token'};const r=await POST(request());assert.equal(r.status,503);assert.doesNotMatch(JSON.stringify(await r.json()),/synthetic-token/)})
