require('./helpers/register-ts.cjs')
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server')
const optional=p=>fs.existsSync(path.join(__dirname,'..',p))?require('../'+p):{}
const {monthlyChartData}=optional('src/lib/budget-chart.ts')
const {createMcpStatusHandler}=optional('src/lib/mcp/status.ts')
const {McpStatusCard}=optional('src/components/conexiones/McpStatusCard.tsx')
const owner='11111111-1111-4111-8111-111111111111'
const config={origin:'https://fixture.invalid',resource:'https://fixture.invalid/api/mcp',clientId:'legacy',clientSecret:'DO-NOT-EXPOSE',redirects:[]}
function fixture({session={user:{id:owner}},configured=true,dbError=false,count=2}={}){const calls=[];let opened=0;const query={select(...a){calls.push(['select',...a]);return query},eq(...a){calls.push(['eq',...a]);return query},in(...a){calls.push(['in',...a]);return query},is(...a){calls.push(['is',...a]);return query},gt(...a){calls.push(['gt',...a]);return query},then(a,b){return Promise.resolve({count,error:dbError?{message:'DATABASE SECRET'}:null}).then(a,b)}};const deps={getSession:async()=>session,getConfig:()=>{if(!configured)throw new Error('CONFIG SECRET');return config},database:()=>{opened++;return {from:t=>{calls.push(['from',t]);return query}}}};return {calls,deps,opened:()=>opened}}
test('chart orders all twelve months and keeps absent/unloaded months distinct from real zero',()=>{
 assert.equal(typeof monthlyChartData,'function','Monthly chart calculation is not implemented')
 const row=total=>({total,expenses:1,id:1,status:'completed',trend:'stable',previousMonth:0})
 const data=monthlyChartData({marzo:row(90),enero:row(0),mayo:row(Number.NaN)},['marzo','enero','mayo','junio'])
 assert.equal(data.length,12);assert.equal(data[0].month,'Enero');assert.equal(data[0].amount,0);assert.equal(data[1].amount,null);assert.equal(data[2].amount,90);assert.equal(data[4].amount,null);assert.equal(data[5].amount,null);assert.equal(monthlyChartData({enero:row(5)},[])[0].amount,null)
})
test('anonymous status fails before config/database inspection',async()=>{
 assert.equal(typeof createMcpStatusHandler,'function','Authenticated MCP status is not implemented')
 const f=fixture({session:null}),r=await createMcpStatusHandler(f.deps)();assert.equal(r.status,401);assert.equal(f.opened(),0);assert.equal(r.headers.get('cache-control'),'no-store')
})
test('missing config is distinct from zero grants and reveals no internal errors',async()=>{
 assert.equal(typeof createMcpStatusHandler,'function')
 const f=fixture({configured:false}),r=await createMcpStatusHandler(f.deps)();const body=await r.json();assert.equal(body.state,'not_configured');assert.equal(body.activeConnections,null);assert.equal(f.opened(),0);assert.doesNotMatch(JSON.stringify(body),/SECRET/)
})
test('ready status counts only owner/client/unrevoked/unexpired grants without exposing secrets',async()=>{
 assert.equal(typeof createMcpStatusHandler,'function')
 const f=fixture(),r=await createMcpStatusHandler(f.deps)();const body=await r.json();assert.equal(body.state,'ready');assert.equal(body.activeConnections,2);assert.equal(body.endpoint,config.resource);assert.ok(f.calls.some(c=>c[0]==='eq'&&c[1]==='user_id'&&c[2]===owner));assert.ok(f.calls.some(c=>c[0]==='in'&&c[1]==='client_id'));assert.ok(f.calls.some(c=>c[0]==='is'&&c[1]==='revoked_at'&&c[2]===null));assert.ok(f.calls.some(c=>c[0]==='gt'&&c[1]==='expires_at'));assert.ok(f.calls.some(c=>c[0]==='select'&&c[2].head===true));assert.doesNotMatch(JSON.stringify(body),/DO-NOT-EXPOSE|legacy/)
 const empty=fixture({count:0});assert.equal((await (await createMcpStatusHandler(empty.deps)()).json()).activeConnections,0)
})
test('database failure or missing count never displays zero/ready and hides diagnostics',async()=>{
 assert.equal(typeof createMcpStatusHandler,'function')
 for(const opts of [{dbError:true},{count:null}]){const f=fixture(opts),r=await createMcpStatusHandler(f.deps)();assert.equal(r.status,503);const text=await r.text();assert.doesNotMatch(text,/DATABASE SECRET/);assert.equal(JSON.parse(text).state,'unavailable');assert.equal(JSON.parse(text).activeConnections,null)}
})
test('unsupported Google identity cannot query another account grants',async()=>{
 assert.equal(typeof createMcpStatusHandler,'function')
 const f=fixture({session:{user:{id:'google-subject'}}});const body=await (await createMcpStatusHandler(f.deps)()).json();assert.equal(body.accountSupported,false);assert.equal(body.activeConnections,null);assert.equal(f.opened(),0)
})
test('actual status UI distinguishes configured, disconnected, unsupported and unavailable',()=>{
 assert.equal(typeof McpStatusCard,'function','MCP UI is not implemented')
 const render=status=>renderToStaticMarkup(React.createElement(McpStatusCard,{status,onCopy:()=>{}}))
 const ready={state:'ready',endpoint:config.resource,activeConnections:2,accountSupported:true};assert.match(render(ready),/Configurado/);assert.match(render(ready),/2 conexiones activas/);assert.match(render(ready),/Administrar permisos/);assert.match(render({...ready,activeConnections:0}),/Sin conexiones activas/);assert.match(render({...ready,accountSupported:false,activeConnections:null}),/correo y contraseña/);assert.match(render({state:'not_configured',endpoint:null,activeConnections:null,accountSupported:true}),/Sin configurar/);assert.match(render({...ready,state:'unavailable',activeConnections:null}),/No disponible/);assert.doesNotMatch(render({...ready,state:'unavailable',activeConnections:null}),/Sin conexiones activas/)
})
