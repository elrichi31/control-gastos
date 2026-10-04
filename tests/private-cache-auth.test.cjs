require('./helpers/register-ts.cjs')
const {test}=require('node:test'),assert=require('node:assert/strict'),Module=require('node:module'),fs=require('node:fs'),path=require('node:path')
const load=Module._load
Module._load=function(name,...args){if(name==='@serwist/next')return options=>config=>({options,config});if(name==='@supabase/supabase-js')return {createClient:()=>({auth:{signInWithPassword:async()=>({data:{user:{id:'existing',email:'fixture@example.invalid',user_metadata:{full_name:'Fixture'}}},error:null})}})};return load.call(this,name,...args)}
const {options,config}=require('../next.config.ts').default
const {runtimeCaching}=require('../src/lib/pwa/cache-policy.ts')
const sw=fs.readFileSync(path.join(__dirname,'../src/app/sw.ts'),'utf8')
const {authOptions}=require('../src/lib/auth/auth.ts');Module._load=load
function matches(pattern,url,headers={}){return pattern instanceof RegExp?pattern.test(url):pattern({url:new URL(url),request:new Request(url,{headers})})}
test('private API and Supabase traffic is NetworkOnly, including image-looking paths',()=>{
 for(const [url,headers] of [['https://fixture.invalid/api/gastos'],['https://fixture.invalid/api/auth/session'],['https://fixture.invalid/api/mcp/connections'],['https://fixture.invalid/api/private.png'],['https://project.supabase.co/rest/v1/gasto'],['https://custom-db.invalid/rest/v1/gasto',{apikey:'synthetic'}],['https://fixture.invalid/images/private.png',{authorization:'Bearer synthetic'}]]){const route=runtimeCaching.find(r=>matches(r.urlPattern,url,headers));assert.equal(route?.handler,'NetworkOnly',url)}
 // The worker must use only this policy: Serwist's defaultCache caches API/pages with NetworkFirst.
 assert.doesNotMatch(sw,/import\s*\{[^}]*defaultCache/);assert.match(sw,/runtimeCaching\.map/);assert.equal(options.swSrc,'src/app/sw.ts')
})
test('static font caching is preserved and global API responses disable HTTP storage',async()=>{
 assert.equal(runtimeCaching.find(r=>matches(r.urlPattern,'https://fonts.gstatic.com/font.woff2')).handler,'CacheFirst')
 const rules=await config.headers();const api=rules.find(r=>r.source==='/api/:path*');assert.ok(api.headers.some(h=>h.key==='Cache-Control'&&h.value==='no-store'))
})
test('redirect callback rejects deceptive hosts, scheme changes and malformed destinations',async()=>{
 const baseUrl='https://fixture.invalid'
 for(const url of ['https://fixture.invalid.evil.invalid/phishing','https://evil.invalid','//evil.invalid','/\\evil.invalid','http://fixture.invalid/dashboard','https://%'])assert.equal(await authOptions.callbacks.redirect({url,baseUrl}),baseUrl+'/dashboard',url)
 for(const url of ['/dashboard','/api/mcp/oauth/authorize?state=x','https://fixture.invalid/dashboard'])assert.equal(await authOptions.callbacks.redirect({url,baseUrl}),new URL(url,baseUrl).href)
})
test('existing-account password login remains valid',async()=>{
 const provider=authOptions.providers.find(p=>p.id==='credentials');const user=await provider.options.authorize({email:'fixture@example.invalid',password:'fixture'},{});assert.equal(user.id,'existing');assert.equal(user.name,'Fixture')
})
test('legacy private caches are purged without deleting public static caches',async()=>{
 const {clearPrivateCaches}=require('../src/lib/pwa/cache-policy.ts');const names=new Set(['api-cache','supabase-api-cache','start-url','google-fonts','image-cache','workbox-precache-v2']);const storage={keys:async()=>[...names],delete:async n=>names.delete(n)}
 assert.equal(await clearPrivateCaches(storage),true);assert.deepEqual([...names],['google-fonts','workbox-precache-v2']);assert.equal(await clearPrivateCaches({keys:async()=>{throw new Error('Storage unavailable')}}),false)
})
test('worker activation runs legacy purge and logout awaits purge before signOut',()=>{
 const worker=sw;assert.match(worker,/addEventListener\(['"]activate['"]/);assert.match(worker,/waitUntil\(clearPrivateCaches\(\)\)/)
 const sidebar=fs.readFileSync(path.join(__dirname,'../src/components/Sidebar.tsx'),'utf8');assert.ok(sidebar.indexOf('await clearPrivateCaches()')<sidebar.indexOf('await signOut('));assert.ok(sidebar.includes('await clearPrivateCaches()'))
})
