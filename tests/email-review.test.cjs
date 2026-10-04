require('./helpers/register-ts.cjs')
const test = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')
const fs = require('node:fs')
const path = require('node:path')
const { findCandidates } = require('../src/lib/email-matches.ts')

const g = (id, monto, fecha, descripcion = 'Gasto') => ({ id, descripcion, monto, fecha })

test('duplicados: mismo monto o la mitad, a ±2 días; mismo monto primero', () => {
  const gastos = [g(1, 3.25, '2026-10-02', 'Almuerzo'), g(2, 1.63, '2026-10-02'), g(3, 3.25, '2026-10-06'), g(4, 9, '2026-10-02'), g(5, 3.25, '2026-10-01')]
  const found = findCandidates({ tipo: 'gasto', fecha: '2026-10-02', monto: 3.25 }, gastos)
  // 1.63 es la mitad de 3.25 redondeada al centavo: cuenta como "mitad".
  assert.deepEqual(found.map(c => [c.gasto.id, c.kind]), [[1, 'igual'], [5, 'igual'], [2, 'mitad']])
  const shared = findCandidates({ tipo: 'gasto', fecha: '2026-10-02', monto: 20 }, [g(6, 10, '2026-10-03')])
  assert.deepEqual(shared.map(c => [c.gasto.id, c.kind, c.dias]), [[6, 'mitad', 1]])
})

test('ingresos: gastos previos mayores a lo recibido; el doble exacto primero', () => {
  const gastos = [g(1, 30, '2026-10-01'), g(2, 20, '2026-09-25'), g(3, 10, '2026-10-01'), g(4, 50, '2026-08-01'), g(5, 40, '2026-10-09')]
  const found = findCandidates({ tipo: 'ingreso', fecha: '2026-10-02', monto: 10 }, gastos)
  assert.deepEqual(found.map(c => c.gasto.id), [2, 1])
  assert.equal(found[0].kind, 'mitad')
})

// --- PATCH contra una base en memoria ---------------------------------------------------
function fakeDb(tables) {
  let nextId = 100
  function query(table) {
    const filters = []; let op = 'select', payload, returning = false, single = false
    const rows = () => tables[table].filter(r => filters.every(f => f(r)))
    const run = () => {
      if (op === 'insert') { const added = [].concat(payload).map(r => ({ id: nextId++, ...r })); tables[table].push(...added); return { data: added, error: null } }
      if (op === 'update') { const hit = rows(); hit.forEach(r => Object.assign(r, payload)); return { data: returning ? (single ? hit[0] ?? null : hit) : null, error: null } }
      const hit = rows(); return { data: single ? hit[0] ?? null : hit, error: null }
    }
    const q = {
      select() { if (op !== 'select') returning = true; return q },
      update(v) { op = 'update'; payload = v; return q },
      insert(v) { op = 'insert'; payload = v; return q },
      eq(k, v) { filters.push(r => r[k] === v); return q },
      in(k, v) { filters.push(r => v.includes(r[k])); return q },
      maybeSingle() { single = true; return q },
      then(resolve, reject) { return Promise.resolve(run()).then(resolve, reject) },
    }
    return q
  }
  return { from: query }
}

const owner = 'owner-uuid'
let db
const realLoad = Module._load
Module._load = function (request, ...args) {
  if (request === '@/lib/auth') return { getAuthenticatedSupabaseClient: async () => ({ error: null, supabase: db, userId: owner }) }
  return realLoad.call(this, request, ...args)
}
Object.assign(process.env, { YAHOO_EMAIL: 'x@yahoo.invalid', YAHOO_APP_PASSWORD: 'synthetic', YAHOO_IMPORT_USER_ID: owner })
const { PATCH } = require('../src/app/api/email-import/yahoo/route.ts')
Module._load = realLoad
const patch = body => PATCH(new Request('https://fixture.invalid/api/email-import/yahoo', { method: 'PATCH', body: JSON.stringify(body) }))
const pending = (id, extra) => ({ id, user_id: owner, estado: 'pendiente', tipo: 'gasto', fecha: '2026-10-02', descripcion: 'Correo', monto: 20, categoria_id: 1, metodo_pago_id: 2, gasto_id: null, ...extra })

test('aceptar con mitad registra tu parte con tags auto + compartido; repetir no duplica', async () => {
  const tables = { correo_consumo: [pending(1), pending(2, { monto: 7.5 })], gasto: [] }
  db = fakeDb(tables)
  const res = await patch({ aceptar: [{ id: 1, categoria_id: 3, monto: 10 }, { id: 2, categoria_id: 4 }] })
  assert.deepEqual(await res.json(), { aceptados: 2, vinculados: 0, descartados: 0 })
  const [mitad, entero] = tables.gasto
  assert.deepEqual([mitad.monto, mitad.tags, mitad.categoria_id, mitad.user_id], [10, ['auto', 'compartido'], 3, owner])
  assert.deepEqual([entero.monto, entero.tags], [7.5, ['auto']])
  await patch({ aceptar: [{ id: 1, categoria_id: 3 }] })
  assert.equal(tables.gasto.length, 2)
})

test('vincular un duplicado no crea gasto; un ingreso se descuenta del gasto elegido', async () => {
  const tables = { correo_consumo: [pending(1, { monto: 3.25 }), pending(2, { tipo: 'ingreso', monto: 10, categoria_id: null })], gasto: [{ id: 50, user_id: owner, monto: 20, tags: ['cena'] }, { id: 51, user_id: owner, monto: 3.25, tags: [] }] }
  db = fakeDb(tables)
  const res = await patch({ vincular: [{ id: 1, gasto_id: 51 }, { id: 2, gasto_id: 50 }] })
  assert.deepEqual(await res.json(), { aceptados: 0, vinculados: 2, descartados: 0 })
  assert.equal(tables.gasto.length, 2)
  assert.deepEqual([tables.gasto[0].monto, tables.gasto[0].tags], [10, ['cena', 'compartido']])
  assert.deepEqual(tables.correo_consumo.map(r => [r.estado, r.gasto_id]), [['vinculado', 51], ['vinculado', 50]])
})

test('un ingreso igual o mayor al gasto se rechaza y queda pendiente; gastos ajenos se ignoran', async () => {
  const tables = { correo_consumo: [pending(1, { tipo: 'ingreso', monto: 20 })], gasto: [{ id: 50, user_id: owner, monto: 20, tags: [] }, { id: 60, user_id: 'otro', monto: 99, tags: [] }] }
  db = fakeDb(tables)
  assert.equal((await patch({ vincular: [{ id: 1, gasto_id: 50 }] })).status, 400)
  assert.deepEqual([tables.correo_consumo[0].estado, tables.correo_consumo[0].gasto_id, tables.gasto[0].monto], ['pendiente', null, 20])
  assert.deepEqual(await (await patch({ vincular: [{ id: 1, gasto_id: 60 }] })).json(), { aceptados: 0, vinculados: 0, descartados: 0 })
  assert.equal(tables.gasto[1].monto, 99)
})

test('migraciones de correo: idempotentes, estados válidos y cerradas a roles públicos (PostgreSQL aislado)', async () => {
  const { PGlite } = require('@electric-sql/pglite'), pg = new PGlite()
  try {
    await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;')
    for (const name of ['20261010_correo_consumo.sql', '20261011_correo_consumo_vinculos.sql', '20261010_correo_consumo.sql', '20261011_correo_consumo_vinculos.sql']) {
      await pg.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations', name), 'utf8'))
    }
    await pg.query("INSERT INTO public.correo_consumo(user_id,email_message_id,origen,fecha,descripcion,monto,tipo,estado,gasto_id) VALUES ('u','<a>','Deuna','2026-10-02','Recibido de X',10,'ingreso','vinculado',5)")
    await assert.rejects(() => pg.query("INSERT INTO public.correo_consumo(user_id,email_message_id,origen,fecha,descripcion,monto,estado) VALUES ('u','<b>','D','2026-10-02','x',1,'raro')"), /check/)
    await assert.rejects(() => pg.query("INSERT INTO public.correo_consumo(user_id,email_message_id,origen,fecha,descripcion,monto) VALUES ('u','<a>','D','2026-10-02','x',1)"), /duplicate|unique/)
    for (const role of ['anon', 'authenticated']) {
      await pg.exec('SET ROLE ' + role)
      await assert.rejects(() => pg.query('SELECT * FROM public.correo_consumo'), /permission denied/)
      await pg.exec('RESET ROLE')
    }
  } finally { await pg.close() }
})
