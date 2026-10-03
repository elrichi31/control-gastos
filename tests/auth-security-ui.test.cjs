require('./helpers/register-ts.cjs')
const {test}=require('node:test'),assert=require('node:assert/strict'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server')
const Module=require('node:module'),originalLoad=Module._load
Module._load=function(id,...args){if(id==='next/navigation')return{usePathname:()=>'/auth/login',useRouter:()=>({push(){}}),useSearchParams:()=>new URLSearchParams()};return originalLoad.call(this,id,...args)}
const Login=require('../src/app/auth/login/page.tsx').default
Module._load=originalLoad
const {SessionSecurityCard}=require('../src/components/conexiones/SessionSecurity.tsx'),Register=require('../src/app/auth/register/page.tsx').default
test('login screen offers public registration',()=>{assert.match(renderToStaticMarkup(React.createElement(Login)),/href="\/auth\/register"/)})
const render=props=>renderToStaticMarkup(React.createElement(SessionSecurityCard,{busy:false,message:'',onRevoke(){},...props}))
test('session security control only becomes usable when server confirms registry activation',()=>{for(const enabled of [null,false])assert.match(render({enabled}),/<button[^>]*\sdisabled(?:=|\s|>)/);assert.match(render({enabled:false}),/pendiente de activación/);assert.doesNotMatch(render({enabled:true}),/<button[^>]*\sdisabled(?:=|\s|>)/);assert.match(render({enabled:true,busy:true}),/Cerrando sesiones/);assert.match(render({enabled:true,message:'No disponible'}),/role="alert"/)})
test('registration screen accepts new accounts and retains login navigation',()=>{const html=renderToStaticMarkup(React.createElement(Register));assert.match(html,/<form/);assert.match(html,/type="password"/);assert.match(html,/href="\/auth\/login"/);assert.doesNotMatch(html,/registro público está cerrado|Registrarse con Google/)})
