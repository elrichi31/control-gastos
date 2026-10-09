require('./helpers/register-ts.cjs')
const test = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const Module = require('node:module'), original = Module._load
Module._load = function(request, ...args) {
  if (request === '@/hooks/useGastosFiltrados') return { useGastosFiltrados: () => ({ gastos: [], loading: false, error: null }) }
  if (request === '@/components/layout/PageTitle') return { PageTitle: () => null }
  return original.call(this, request, ...args)
}
const Page = require('../src/app/estadisticas/page.tsx').default
Module._load = original

test('estadísticas ofrece pestañas separadas sin la antigua extrapolación en el análisis', () => {
  const html = renderToStaticMarkup(React.createElement(Page))
  assert.match(html, /role="tablist"/)
  assert.match(html, /Análisis/)
  assert.match(html, /Proyecciones/)
  assert.doesNotMatch(html, /Cerrarías el mes en/)
})
