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
  if (request === '@/components/layout/CronStatus') return { CronStatus: () => null }
  if (request === '@/components/layout/mode-toggle') return { ModeToggle: () => null }
  return load.call(this, request, ...args)
}
const { TopBar } = require('../src/components/layout/TopBar.tsx')
const { Sidebar } = require('../src/components/layout/Sidebar.tsx')
const { ExpenseDialogProvider } = require('../src/components/gastos/ExpenseDialogProvider.tsx')
Module._load = load
const renderNavigation = node => renderToStaticMarkup(React.createElement(ExpenseDialogProvider, null, node))
const sidebarProps = { isOpen: false, onClose() {}, isMobile: true, isCollapsed: false, onToggleCollapse() {} }

test('la barra ofrece registrar un gasto sin afirmar un estado no observado', () => {
  pathname = '/dashboard'
  const html = renderNavigation(React.createElement(TopBar, { onMenuClick() {}, isMobile: true, isMenuOpen: false }))
  assert.match(html, /<button[^>]*aria-haspopup="dialog"/)
  assert.doesNotMatch(html, /href="\/form"/)
  assert.match(html, /Nuevo gasto/)
  assert.doesNotMatch(html, />Activo</)
})

test('el menú móvil cerrado no expone enlaces invisibles al teclado', () => {
  const html = renderToStaticMarkup(React.createElement(Sidebar, sidebarProps))
  assert.equal(/href="\/dashboard"/.test(html), false, 'El menú cerrado no debe renderizar enlaces navegables')
})

test('el registro sigue disponible desde estadísticas sin navegar a otra página', () => {
  pathname = '/estadisticas'
  const html = renderNavigation(React.createElement(TopBar, { onMenuClick() {}, isMobile: true }))
  assert.match(html, /Nuevo gasto/)
  assert.match(html, /aria-haspopup="dialog"/)
  assert.doesNotMatch(html, /href="\/form"/)
})

test('el botón de apertura comunica el estado y el menú que controla', () => {
  pathname = '/dashboard'
  const html = renderNavigation(React.createElement(TopBar, { onMenuClick() {}, isMobile: true, isMenuOpen: true }))
  assert.match(html, /id="mobile-menu-trigger"[^>]*aria-expanded="true"[^>]*aria-controls="mobile-navigation"/)
})

test('el menú colapsado conserva nombres accesibles y la ruta activa anidada', () => {
  pathname = '/presupuesto/42'
  const html = renderNavigation(React.createElement(Sidebar, { ...sidebarProps, isMobile: false, isCollapsed: true }))
  assert.match(html, /href="\/presupuesto"[^>]*aria-label="Presupuesto"[^>]*aria-current="page"/)
  assert.equal((html.match(/aria-label="(?:Resumen|Detalle de gastos|Presupuesto|Estadísticas|Desde correo|Recurrentes|Conexiones MCP)"/g) || []).length, 7)
})

test('cerrar el menú móvil no roba el foco al modal de gasto que acaba de abrir', () => {
  const { MobileDrawer } = require('../src/components/layout/MobileDrawer.tsx')
  const tree = MobileDrawer({ isOpen: true, onClose() {}, children: null })
  const portal = tree.props.children
  const content = React.Children.toArray(portal.props.children).find(node => node.props.onCloseAutoFocus)
  const previousDocument = global.document
  let focused = 0, prevented = 0, modalOpen = true
  global.document = { querySelector: () => modalOpen ? {} : null, getElementById: () => ({ focus() { focused++ } }) }
  try {
    content.props.onCloseAutoFocus({ preventDefault() { prevented++ } })
    assert.equal(focused, 0, 'El modal conserva su foco')
    modalOpen = false
    content.props.onCloseAutoFocus({ preventDefault() { prevented++ } })
    assert.equal(focused, 1, 'El cierre normal devuelve el foco al menú')
    assert.equal(prevented, 2)
  } finally { if (previousDocument === undefined) delete global.document; else global.document = previousDocument }
})
