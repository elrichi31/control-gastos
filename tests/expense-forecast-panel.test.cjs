require('./helpers/register-ts.cjs')
const test = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { ProjectionPanel, fetchExpenseForecast } = require('../src/components/stats/projection-panel.tsx')
const { buildExpenseForecast } = require('../src/lib/expense-forecast.ts')

test('carga privada sin caché y rechaza HTTP fallido y respuestas incompletas', async () => {
  const original = global.fetch
  try {
    const today = '2026-10-08', payload = buildExpenseForecast({ today, expenses: [], rules: [] })
    const controller = new AbortController()
    global.fetch = async (url, options) => {
      assert.equal(url, `/api/estadisticas/proyeccion?today=${today}`)
      assert.equal(options.cache, 'no-store')
      assert.equal(options.signal, controller.signal)
      return new Response(JSON.stringify(payload))
    }
    assert.deepEqual(await fetchExpenseForecast(today, controller.signal), payload)
    global.fetch = async () => new Response('{}', { status: 500 })
    await assert.rejects(fetchExpenseForecast(today, controller.signal))
    global.fetch = async () => new Response('{}')
    await assert.rejects(fetchExpenseForecast(today, controller.signal))
    global.fetch = async () => new Response('no-json')
    await assert.rejects(fetchExpenseForecast(today, controller.signal))
  } finally { global.fetch = original }
})
test('la carga tiene estado accesible y el control permite actualizar sin resultados previos', () => {
  const html = renderToStaticMarkup(React.createElement(ProjectionPanel))
  assert.match(html, /role="status"/)
  assert.match(html, /Cargando historial/)
  assert.match(html, /Actualizar proyección/)
  assert.doesNotMatch(html, /Gasto estimado al finalizar/)
})
