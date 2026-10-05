require('./helpers/register-ts.cjs')
const { test } = require('node:test'), assert = require('node:assert/strict'), Module = require('node:module')
const load = Module._load, react = require('react')
Module._load = function (id, ...args) {
  if (id === 'react') return { ...react, useState: initial => [initial, () => {}] }
  if (id.startsWith('@/components/ui/')) return new Proxy({}, { get: (_, key) => key })
  return load.call(this, id, ...args)
}
const { ExportarDatos } = require('../src/components/detalle-gastos/ExportarDatos.tsx')
Module._load = load
function cells(csv) {
  const rows = []; let row = [], cell = '', quoted = false
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i]
    if (c === '"') { if (quoted && csv[i+1] === '"') { cell += '"'; i++ } else quoted = !quoted }
    else if (!quoted && c === ',') { row.push(cell); cell = '' }
    else if (!quoted && c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = '' }
    else cell += c
  }
  row.push(cell); rows.push(row); return rows
}
function exportButton(node) {
  if (!node || typeof node !== 'object') return null
  if (node.props?.onClick && JSON.stringify(node.props.children).includes('Exportar')) return node
  for (const child of [node.props?.children].flat(Infinity)) { const found = exportButton(child); if (found) return found }
  return null
}
async function exported(rows) {
  const oldDocument = global.document, oldCreate = URL.createObjectURL, oldRevoke = URL.revokeObjectURL; let blob
  global.document = { createElement: () => ({ setAttribute() {}, style: {}, click() {} }), body: { appendChild() {}, removeChild() {} } }
  URL.createObjectURL = value => { blob = value; return 'blob:fixture' }; URL.revokeObjectURL = () => {}
  try {
    const button = exportButton(ExportarDatos({ gastos: rows, gastosOriginal: rows }))
    assert.ok(button); button.props.onClick(); return cells(await blob.text())
  } finally { global.document = oldDocument; URL.createObjectURL = oldCreate; URL.revokeObjectURL = oldRevoke }
}
const gasto = (descripcion, categoria = 'Alimentos', metodo = 'Efectivo') => ({ id: 1, fecha: '2026-10-05', descripcion, monto: 12.34, categoria: { nombre: categoria }, metodo_pago: { nombre: metodo } })
test('real CSV export neutralizes formulas in every text column', async () => {
  for (const value of ['=1+1', '+1+1', '-1+1', '@SUM(1)', '  =1+1', '\t=1+1', '\r=1+1', '\n=1+1', '＝1+1']) {
    const rows = await exported([gasto(value, value, value)])
    assert.equal(rows.length, 2)
    for (const column of [1, 3, 4]) assert.equal(rows[1][column], "'"+value, JSON.stringify(value))
    assert.equal(rows[1][2], '12.34')
  }
})
test('CSV quotes delimiters, quotes and embedded newlines without inventing cells', async () => {
  const text = 'Compra, "especial"\nsegunda línea'
  const rows = await exported([gasto(text, 'A,"B"', 'Tarjeta\r\nVisa')])
  assert.equal(rows.length, 2); assert.equal(rows[1].length, 5)
  assert.deepEqual(rows[1], ['2026-10-05', text, '12.34', 'A,"B"', 'Tarjeta\r\nVisa'])
})
