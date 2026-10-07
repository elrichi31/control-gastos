require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const Module = require('node:module')
const load = Module._load
let pathname = '/dashboard'
Module._load = function (request, ...args) {
  if (request === 'next/navigation') return { usePathname: () => pathname }
  if (request === 'next-auth/react') return { useSession: () => ({ data: { user: { name: 'Usuario de prueba', email: 'fixture@example.invalid' } } }), signOut: async () => {} }
  if (request === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) }
  if (request === '@/components/CronStatus') return { CronStatus: () => null }
  if (request === '@/components/mode-toggle') return { ModeToggle: () => null }
  return load.call(this, request, ...args)
}
const { TopBar } = require('../src/components/TopBar.tsx')
const { Sidebar } = require('../src/components/Sidebar.tsx')
Module._load = load
const sidebarProps = { isOpen: false, onClose() {}, isMobile: true, isCollapsed: false, onToggleCollapse() {} }

test('la barra ofrece registrar un gasto sin afirmar un estado no observado', () => {
  pathname = '/dashboard'
  const html = renderToStaticMarkup(React.createElement(TopBar, { onMenuClick() {}, isMobile: true, isMenuOpen: false }))
  assert.match(html, /href="\/form"/)
  assert.match(html, /Nuevo gasto/)
  assert.doesNotMatch(html, />Activo</)
})

test('el menú móvil cerrado no expone enlaces invisibles al teclado', () => {
  const html = renderToStaticMarkup(React.createElement(Sidebar, sidebarProps))
  assert.equal(/href="\/dashboard"/.test(html), false, 'El menú cerrado no debe renderizar enlaces navegables')
})

test('el acceso rápido no se duplica dentro del formulario de nuevo gasto', () => {
  pathname = '/form'
  const html = renderToStaticMarkup(React.createElement(TopBar, { onMenuClick() {}, isMobile: true }))
  assert.equal(/href="\/form"/.test(html), false)
})

test('el botón de apertura comunica el estado y el menú que controla', () => {
  pathname = '/dashboard'
  const html = renderToStaticMarkup(React.createElement(TopBar, { onMenuClick() {}, isMobile: true, isMenuOpen: true }))
  assert.match(html, /id="mobile-menu-trigger"[^>]*aria-expanded="true"[^>]*aria-controls="mobile-navigation"/)
})

test('el menú colapsado conserva nombres accesibles y la ruta activa anidada', () => {
  pathname = '/presupuesto/42'
  const html = renderToStaticMarkup(React.createElement(Sidebar, { ...sidebarProps, isMobile: false, isCollapsed: true }))
  assert.match(html, /href="\/presupuesto"[^>]*aria-label="Presupuesto"[^>]*aria-current="page"/)
  assert.equal((html.match(/aria-label="(?:Resumen|Detalle de gastos|Presupuesto|Estadísticas|Nuevo gasto|Desde correo|Recurrentes|Conexiones MCP)"/g) || []).length, 8)
})
