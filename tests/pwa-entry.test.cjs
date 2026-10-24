require('./helpers/register-ts.cjs')
const {test}=require('node:test'),assert=require('node:assert/strict')
const {mobileEntryTarget}=require('../src/lib/pwa/entry.ts')
test('mobile UA and explicit PWA entry use the server auth decision without affecting normal desktop landing',()=>{
 for(const ua of ['Android','iPhone','iPad','iPod']) {
  assert.equal(mobileEntryTarget('/',ua,false,true),'/form')
  assert.equal(mobileEntryTarget('/',ua,false,false),'/auth/login')
 }
 assert.equal(mobileEntryTarget('/','Desktop',true,true),'/form')
 assert.equal(mobileEntryTarget('/','Desktop',true,false),'/auth/login')
 assert.equal(mobileEntryTarget('/','Desktop',false,true),null)
 assert.equal(mobileEntryTarget('/auth/login','Android',true,true),null)
})
