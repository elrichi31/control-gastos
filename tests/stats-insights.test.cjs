require('./helpers/register-ts.cjs')
const test = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { useStatsAnalytics } = require('../src/hooks/useStatsAnalytics.ts')
const filters = { filterType: 'year-month', year: '2025', month: 'enero', dateFrom: '', dateTo: '' }
const expense = (fecha, monto, nombre = 'Comida') => ({ id: fecha + monto, fecha, monto, descripcion: nombre, categoria: { nombre } })
function analytics(current, previous = [], f = filters) {
  let result
  function Probe() { result = useStatsAnalytics([...current, ...previous], f, current); return null }
  renderToStaticMarkup(React.createElement(Probe))
  return result
}
test('los cambios incluyen categorías que dejaron de tener gasto y ordenan por impacto monetario', () => {
  const a = analytics([expense('2025-01-01', 60)], [expense('2024-12-01', 20), expense('2024-12-02', 90, 'Ocio')])
  assert.deepEqual(a.cambiosCategoria.map(c => [c.nombre, c.diferencia]), [['Ocio', -90], ['Comida', 40]])
  assert.equal(a.cambiosCategoria.reduce((s, c) => s + c.diferencia, 0), a.kpis.total - a.kpis.totalPrevio)
})
test('el resumen agrupa por semana y tamaño sin perder montos ni compras', () => {
  const a = analytics([expense('2025-01-01', 10), expense('2025-01-01', 50), expense('2025-01-08', 100), expense('2025-01-30', 200)])
  assert.deepEqual(a.porSemana.map(s => s.total), [60, 100, 0, 0, 200])
  assert.deepEqual(a.porSemana.map(s => s.dias), [7, 7, 7, 7, 3])
  assert.deepEqual(a.porTamano.map(b => b.conteo), [1, 1, 1, 1])
  assert.equal(a.porTamano.reduce((s, b) => s + b.total, 0), 360)
  assert.equal(a.mediana, 75)
  assert.deepEqual(a.diaPico, { fecha: '2025-01-30', total: 200, conteo: 1 })
})
test('un período futuro no inventa días sin gasto ni una caída frente al anterior', () => {
  const a = analytics([], [expense('2098-12-01', 50)], { ...filters, year: '2099' })
  assert.equal(a.diasTranscurridos, 0)
  assert.equal(a.diasSinGasto, 0)
  assert.equal(a.kpis.hayComparacion, false)
  assert.equal(a.evolucion[0].actual, null)
  assert.equal(a.acumulado[0].actual, null)
  assert.deepEqual(a.porSemana, [])
})
test('el mes en curso corta el gráfico a hoy e incluye todo el último día comparable', () => {
  const NativeDate = global.Date
  global.Date = class extends NativeDate { constructor(...args) { super(...(args.length ? args : ['2025-01-08T12:00:00'])) } }
  try {
    const a = analytics([expense('2025-01-01', 10)], [expense('2024-12-08', 30)])
    assert.equal(a.kpis.totalPrevio, 30)
    assert.equal(a.evolucion[7].actual, 0)
    assert.equal(a.evolucion[8].actual, null)
    assert.equal(a.acumulado[8].actual, null)
    assert.deepEqual(a.porSemana.map(s => s.dias), [7, 1])
  } finally { global.Date = NativeDate }
})
test('el historial vacío y los filtros no continuos no inventan estadísticas de calendario', () => {
  const a = analytics([], [], { ...filters, filterType: 'all' })
  assert.equal(a.mediana, null)
  assert.equal(a.diaPico, null)
  assert.deepEqual(a.cambiosCategoria, [])
  assert.deepEqual(a.porSemana, [])
  assert.equal(a.porTamano.reduce((s, b) => s + b.conteo, 0), 0)
})
test('los insights y gráficos explican montos, medianas y semanas parciales sin depender de tooltips', () => {
  const { InsightsSummary, WeeklySpending, CategoryChanges, PurchaseSizes } = require('../src/components/stats/spending-insights.tsx')
  const a = analytics([expense('2025-01-01', 10), expense('2025-01-30', 200)], [expense('2024-12-01', 30)])
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null,
    ...[InsightsSummary, WeeklySpending, CategoryChanges, PurchaseSizes].map((c, i) => React.createElement(c, { key: i, analytics: a }))))
  for (const label of ['Qué destaca', 'Qué cambió por categoría', 'Gasto por semana', 'Tamaño de tus compras', 'Compra habitual', '3 días', 'Hasta $10', 'Subió']) assert.ok(html.includes(label), label)
  assert.match(html, /aria-pressed="true"/)
  assert.match(html, /\$200\.00/)
})
test('la evolución explica las barras y sus controles accesibles', () => {
  const { EvolutionChart } = require('../src/components/stats/evolution-chart.tsx')
  const html = renderToStaticMarkup(React.createElement(EvolutionChart, { diario: [{ etiqueta: '1', actual: 10, previo: null }], acumulado: [{ etiqueta: '1', actual: 10, previo: null }], titulo: 'Evolución diaria', esDiario: true }))
  for (const text of ['Por día', 'Acumulado', 'Cada barra', 'aria-pressed="true"']) assert.ok(html.includes(text), text)
})
test('los rangos personalizados mantienen los días locales incluidos en sus límites', () => {
  const previousTZ = process.env.TZ
  process.env.TZ = 'America/New_York'
  try {
    const { useDataProcessing } = require('../src/hooks/useDataProcessing.ts')
    let result
    const gastos = [expense('2025-01-01', 10), expense('2025-01-02', 20)]
    function Probe() { result = useDataProcessing({ gastos, currentFilters: { ...filters, filterType: 'custom', dateFrom: '2025-01-01', dateTo: '2025-01-02' } }); return null }
    renderToStaticMarkup(React.createElement(Probe))
    assert.equal(result.filteredGastos.length, 2)
  } finally { if (previousTZ === undefined) delete process.env.TZ; else process.env.TZ = previousTZ }
})
test('el filtrado de estadísticas conserva los períodos y el orden de los gastos', () => {
  const { useDataProcessing } = require('../src/hooks/useDataProcessing.ts')
  const gastos = [expense('2024-01-10', 10), expense('2025-01-15', 20), expense('2025-02-10', 30)]
  for (const [overrides, expected] of [
    [{ filterType: 'year-month' }, [gastos[1]]],
    [{ filterType: 'year' }, [gastos[1], gastos[2]]],
    [{ filterType: 'month', month: 'ENERO' }, [gastos[0], gastos[1]]],
    [{ filterType: 'custom', dateFrom: '2025-01-15', dateTo: '2025-02-10' }, [gastos[1], gastos[2]]],
    [{ filterType: 'custom', dateFrom: '', dateTo: '2025-02-10' }, gastos],
    [{ filterType: 'all' }, gastos],
  ]) {
    let result
    function Probe() { result = useDataProcessing({ gastos, currentFilters: { ...filters, ...overrides } }); return null }
    renderToStaticMarkup(React.createElement(Probe))
    assert.deepEqual(result.filteredGastos, expected, overrides.filterType)
  }
})
test('un rango largo personalizado conserva el total anterior al agruparlo por meses', () => {
  const a = analytics([expense('2025-04-01', 20)], [expense('2024-12-20', 100)], { ...filters, filterType: 'custom', dateFrom: '2025-03-20', dateTo: '2025-06-20' })
  assert.equal(a.kpis.totalPrevio, 100)
  assert.equal(a.evolucion.reduce((s, p) => s + (p.previo ?? 0), 0), 100)
})
