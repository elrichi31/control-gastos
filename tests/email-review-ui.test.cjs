require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const Module = require('node:module')
const events = [], originalLoad = Module._load
const toast = { loading: (text, opts) => events.push(['loading', text, opts]), success: (text, opts) => events.push(['success', text, opts]), error: (text, opts) => events.push(['error', text, opts]) }
Module._load = function(name, ...args) {
  if (name.endsWith('.module.css')) return {}
  if (name === '@/components/PageTitle') return { PageTitle: () => null }
  if (name === 'react-hot-toast') return { __esModule: true, default: toast }
  return originalLoad.call(this, name, ...args)
}
const Page = require('../src/app/gastos-correo/page.tsx').default
Module._load = originalLoad
const row = (id, extra = {}) => ({ id, tipo: 'gasto', origen: 'Banco', fecha: '2026-10-04', descripcion: `Compra ${id}`, monto: 20, categoria_id: 1, coincidencias: [], ...extra })
function elements(node) { if (!node || typeof node !== 'object') return []; return [node, ...React.Children.toArray(node.props?.children).flatMap(elements)] }
async function harness(run) {
  const originals = Object.fromEntries(['useState', 'useEffect', 'useMemo', 'useRef', 'useCallback'].map(k => [k, React[k]]))
  let index = 0, refIndex = 0, effectIndex = 0, unsubscribe; const slots = [true, [row(1), row(2)], [{ id: 1, nombre: 'Comida' }]], refs = []
  React.useState = initial => { const key = index++; if (!(key in slots)) slots[key] = typeof initial === 'function' ? initial() : initial; return [slots[key], value => { slots[key] = typeof value === 'function' ? value(slots[key]) : value }] }
  React.useEffect = fn => { if (effectIndex++ === 0 && !unsubscribe) unsubscribe = fn() }; React.useMemo = fn => fn(); React.useCallback = fn => fn
  React.useRef = initial => { const key = refIndex++; return refs[key] ||= { current: initial } }
  const render = () => { index = refIndex = effectIndex = 0; return elements(Page()) }
  const originalFetch = global.fetch; events.length = 0
  try { await run({ slots, render }) } finally { unsubscribe?.(); Object.assign(React, originals); global.fetch = originalFetch }
}
test('Correo provides count-bearing tabs and a semantic desktop table with mobile labels', async () => {
  await harness(async ({ render }) => {
    const tree = render()
    assert.ok(tree.some(x => x.props?.title === 'Correo'), 'short page title')
    assert.equal(tree.filter(x => ['nuevos', 'duplicados', 'recibidos'].includes(x.props?.value) && x.props?.['data-review-tab']).length, 3)
    assert.ok(tree.some(x => x.type === 'table'))
    assert.ok(tree.some(x => x.props?.['data-label'] === 'Categoría'))
  })
})
test('two real row accepts enqueue without global blocking and toast turns green only after server acknowledgment', async () => {
  await harness(async ({ render }) => {
    const calls = []; let resolveFirst
    const first = new Promise(resolve => { resolveFirst = resolve })
    global.fetch = async (url, options) => {
      if (options?.method === 'PATCH') { calls.push(JSON.parse(options.body)); if (calls.length === 1) return first; return { ok: true, json: async () => ({ aceptados: 1 }) } }
      return { ok: true, json: async () => ({ enabled: true, pendientes: [] }) }
    }
    let tree = render()
    const button = tree.find(x => x.props?.['aria-label'] === 'Aceptar Compra 1')
    assert.ok(button, 'per-row accept is missing'); button.props.onClick(); button.props.onClick()
    tree = render()
    const second = tree.find(x => x.props?.['aria-label'] === 'Aceptar Compra 2')
    assert.equal(second.props.disabled, false); second.props.onClick()
    assert.equal(calls.length, 1); assert.equal(events.filter(x => x[0] === 'success').length, 0)
    assert.ok(events.some(x => x[0] === 'loading' && x[1].includes('cola')))
    resolveFirst({ ok: true, json: async () => ({ aceptados: 1 }) })
    await new Promise(resolve => setTimeout(resolve, 20))
    assert.equal(calls.length, 2); assert.equal(events.filter(x => x[0] === 'success').length, 2)
    assert.equal(calls[0].aceptar[0].categoria_id, 1)
  })
})
test('failed save restores its row, reports the error and never emits a success toast', async () => {
  await harness(async ({ render }) => {
    global.fetch = async (url, options) => options?.method === 'PATCH'
      ? { ok: false, json: async () => ({ error: 'Base no disponible' }) }
      : { ok: true, json: async () => ({ enabled: true, pendientes: [row(1), row(2)] }) }
    const button = render().find(x => x.props?.['aria-label'] === 'Aceptar Compra 1')
    assert.ok(button, 'per-row accept is missing'); button.props.onClick()
    await new Promise(resolve => setTimeout(resolve, 20))
    assert.ok(render().some(x => x.props?.['aria-label'] === 'Aceptar Compra 1'))
    assert.equal(events.filter(x => x[0] === 'success').length, 0)
    assert.ok(events.some(x => x[0] === 'error' && x[1].includes('Base no disponible')))
  })
})
test('zero acknowledged items is not advertised as saved', async () => {
  await harness(async ({ render }) => {
    global.fetch = async (url, options) => options?.method === 'PATCH'
      ? { ok: true, json: async () => ({ aceptados: 0 }) }
      : { ok: true, json: async () => ({ enabled: true, pendientes: [] }) }
    const button = render().find(x => x.props?.['aria-label'] === 'Aceptar Compra 1')
    assert.ok(button, 'per-row accept is missing'); button.props.onClick()
    await new Promise(resolve => setTimeout(resolve, 20))
    assert.equal(events.filter(x => x[0] === 'success').length, 0)
    assert.ok(events.some(x => x[0] === 'error'))
  })
})
