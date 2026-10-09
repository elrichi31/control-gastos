require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const { PGlite } = require('@electric-sql/pglite')
const { parseStoredForeignTax, foreignTaxFromStored, storedForeignTax, emptyForeignTax } = require('../src/lib/foreign-tax.ts')

test('el detalle guardado se valida y vuelve a abrir marcado', () => {
  const stored = { base: 15.99, selected: ['isd', 'iva_digital'], customRate: '' }
  assert.deepEqual(parseStoredForeignTax(stored), stored)
  assert.deepEqual(foreignTaxFromStored(stored), { enabled: true, selected: ['isd', 'iva_digital'], customRate: '' })
  assert.deepEqual(foreignTaxFromStored(null), emptyForeignTax())
  for (const bad of [{ selected: ['isd'] }, { base: -1, selected: ['isd'] }, { base: 1.234, selected: ['isd'] }, { base: 5, selected: [] }, 'isd']) assert.equal(parseStoredForeignTax(bad), null)
  assert.deepEqual(storedForeignTax(15.99, { enabled: true, selected: ['isd'], customRate: '9' }), { base: 15.99, selected: ['isd'], customRate: '' })
  assert.equal(storedForeignTax(10, emptyForeignTax(), true), null, 'desactivar borra el detalle guardado')
  assert.equal(storedForeignTax(10, emptyForeignTax(), false), undefined, 'sin detalle previo no toca la columna')
})

// --- API /api/gastos con y sin la columna (migración aplicada o pendiente)
let calls = [], columnExists = true
const missing = { code: 'PGRST204', message: 'column not found' }
const db = { from(table) {
  const call = { table, filters: [] }; calls.push(call)
  const result = () => {
    const usesTax = (call.insert?.[0] && 'impuesto_exterior' in call.insert[0]) || (call.update && 'impuesto_exterior' in call.update) || String(call.select).includes('impuesto_exterior')
    if (usesTax && !columnExists) return { data: null, error: missing }
    return { data: { id: 7, ...(call.insert?.[0] || call.update) }, error: null }
  }
  const q = { insert(v) { call.insert = v; return q }, update(v) { call.update = v; return q }, select(v) { call.select = v; return q }, eq(k, v) { call.filters.push([k, v]); return q }, order() { return q },
    single: async () => result(), then: resolve => resolve({ ...result(), data: [result().data].filter(Boolean) }) }
  return q
} }
const load = Module._load
Module._load = function (id, ...args) { if (id === '@/lib/auth') return { getAuthenticatedSupabaseClient: async () => ({ error: null, userId: 'owner', supabase: db }) }; return load.call(this, id, ...args) }
const routes = require('../src/app/api/gastos/route.ts')
Module._load = load
const req = (method, body, query = '') => new Request('https://fixture.invalid/api/gastos' + query, { method, headers: { 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
const valid = { descripcion: 'Netflix', monto: 1, fecha: '2026-10-05', categoria_id: 1, metodo_pago_id: 2 }
const tax = { base: 15.99, selected: ['isd', 'iva_digital'], customRate: '' }

test('crear y editar guardan el detalle y el servidor recalcula el total', async () => {
  columnExists = true; calls = []
  assert.equal((await routes.POST(req('POST', { ...valid, impuesto_exterior: tax }))).status, 200)
  assert.equal(calls[0].insert[0].monto, 19.19)
  assert.deepEqual(calls[0].insert[0].impuesto_exterior, tax)
  calls = []
  assert.equal((await routes.PUT(req('PUT', { impuesto_exterior: { ...tax, selected: ['isd'] } }, '?id=7'))).status, 200)
  assert.deepEqual([calls[0].update.monto, calls[0].update.impuesto_exterior.selected], [16.79, ['isd']])
  calls = []
  assert.equal((await routes.PUT(req('PUT', { monto: 20, impuesto_exterior: null }, '?id=7'))).status, 200)
  assert.deepEqual(calls[0].update, { monto: 20, impuesto_exterior: null })
  calls = []
  assert.equal((await routes.POST(req('POST', { ...valid, impuesto_exterior: { base: 5, selected: ['iva_99'] } }))).status, 400)
  assert.equal(calls.length, 0)
})

test('sin la migración la app sigue funcionando y guarda el total', async () => {
  columnExists = false; calls = []
  assert.equal((await routes.GET(req('GET'))).status, 200)
  assert.equal(calls.length, 2, 'reintenta la lectura sin la columna')
  calls = []
  const created = await routes.POST(req('POST', { ...valid, impuesto_exterior: tax }))
  assert.equal(created.status, 200)
  assert.deepEqual([calls[1].insert[0].monto, 'impuesto_exterior' in calls[1].insert[0]], [19.19, false])
  calls = []
  assert.equal((await routes.PUT(req('PUT', { descripcion: 'X', impuesto_exterior: null }, '?id=7'))).status, 200)
  assert.deepEqual(calls[1].update, { descripcion: 'X' })
  columnExists = true
})

test('PostgreSQL: los gastos del cron heredan impuestos y #exterior de su regla; migración repetible', async () => {
  const pg = new PGlite()
  try {
    await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE TABLE gasto_recurrente(id bigint PRIMARY KEY);
      CREATE TABLE gasto(id serial PRIMARY KEY, gasto_recurrente_id bigint, tags text[] NOT NULL DEFAULT '{}');
      INSERT INTO gasto_recurrente VALUES (1), (2);`)
    const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261015_foreign_tax.sql'), 'utf8')
    await pg.exec(sql); await pg.exec(sql)
    await pg.query(`UPDATE gasto_recurrente SET impuesto_exterior=$1 WHERE id=1`, [JSON.stringify(tax)])
    await pg.exec(`INSERT INTO gasto(gasto_recurrente_id) VALUES (1), (2), (NULL); INSERT INTO gasto(gasto_recurrente_id, tags) VALUES (1, '{exterior}')`)
    const rows = (await pg.query('SELECT gasto_recurrente_id, tags, impuesto_exterior FROM gasto ORDER BY id')).rows
    assert.deepEqual(rows.map(r => [r.tags, r.impuesto_exterior]), [[['exterior'], tax], [[], null], [[], null], [['exterior'], tax]])
    await assert.rejects(pg.query(`UPDATE gasto SET impuesto_exterior='"isd"'::jsonb WHERE id=1`), /check constraint/)
  } finally { await pg.close() }
})
