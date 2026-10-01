const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")
const { root } = require("./helpers/register-ts.cjs")
const load = (file) => require(path.join(root, 'src', file))
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props))
const gasto = {
  id: 1, descripcion: 'Compra de prueba', monto: 25, fecha: '2026-10-01',
  categoria_id: 1, categoria: { id: 1, nombre: 'Alimentación' },
  metodo_pago: { id: 1, nombre: 'Efectivo' },
}
const formatMoney = (value) => `$${value.toFixed(2)}`

test('internal primary actions inherit the shared button palette', () => {
  for (const file of ['components/detalle-gastos/ExportarDatos.tsx', 'components/presupuesto/ExpenseModal.tsx', 'components/RecurringExpenseForm.tsx']) {
    const source = fs.readFileSync(path.join(root, 'src', file), 'utf8')
    assert.doesNotMatch(source, /className="[^"]*bg-(?:blue|green|emerald)-600/, `Hardcoded primary palette in ${file}`)
    assert.doesNotMatch(source, /className="[^"]*bg-blue-500/, `Hardcoded primary palette in ${file}`)
  }
})

test('page shell owns responsive width and spacing', () => {
  const file = path.join(root, 'src/components/ui/page-layout.tsx')
  assert.ok(fs.existsSync(file), 'Missing shared page layout')
  const { PageShell, PageHeader } = require(file)
  const html = render(PageShell, { children: React.createElement(PageHeader, {
    title: 'Detalle de gastos', description: 'Historial', actions: React.createElement('button', null, 'Exportar'),
  }) })
  assert.match(html, /max-w-5xl/)
  assert.match(html, /sm:py-8/)
  assert.match(html, /<h1 class="[^"]*font-semibold[^"]*tracking-tight/)
  assert.match(html, /sm:flex-row/)
  assert.match(html, /Exportar/)
})

test('detail KPIs use the same compact grid as dashboard', () => {
  const { EstadisticasResumen } = load('components/detalle-gastos/EstadisticasResumen.tsx')
  const html = render(EstadisticasResumen, { statistics: { total: 100, count: 4, average: 25, categoryStats: [] }, formatMoney })
  assert.match(html, /grid-cols-2 lg:grid-cols-4/)
  assert.match(html, /\$100.00/)
  assert.match(html, /\$25.00/)
  assert.doesNotMatch(html, /text-red-|font-bold|<svg/)
  assert.doesNotMatch(html, /sin período previo/)
})

test('empty detail KPIs preserve zero values', () => {
  const { EstadisticasResumen } = load('components/detalle-gastos/EstadisticasResumen.tsx')
  const html = render(EstadisticasResumen, { statistics: { total: 0, count: 0, average: 0, categoryStats: [] }, formatMoney })
  assert.match(html, /\$0.00/)
  assert.match(html, /Categorías/)
})

test('mobile expense badge uses the dashboard category palette', () => {
  const { GastoCard } = load('components/detalle-gastos/GastoCard.tsx')
  const { getCategoriaColor } = load('lib/constants/app.ts')
  const html = render(GastoCard, { gasto, onDeleteGasto() {}, formatMoney, formatDate: (date) => date })
  for (const token of getCategoriaColor(gasto.categoria.nombre).split(' ')) assert.ok(html.includes(token), `Missing category token ${token}`)
  assert.match(html, /font-normal/)
  assert.match(html, /tabular-nums/)
  assert.doesNotMatch(html, /-\$25.00/)
})

test('desktop expense badge uses the dashboard category palette', () => {
  const { GastoTableRow } = load('components/detalle-gastos/GastoTableRow.tsx')
  const { getCategoriaColor } = load('lib/constants/app.ts')
  const html = render(GastoTableRow, { gasto, onDeleteGasto() {}, formatMoney, formatDate: (date) => date })
  for (const token of getCategoriaColor(gasto.categoria.nombre).split(' ')) assert.ok(html.includes(token), `Missing category token ${token}`)
  assert.match(html, /tabular-nums/)
})

test('card heading defaults match dashboard section hierarchy', () => {
  const { CardTitle } = load('components/ui/card.tsx')
  const html = render(CardTitle, { children: 'Filtros' })
  assert.match(html, /text-base font-semibold/)
  assert.doesNotMatch(html, /text-2xl/)
})
