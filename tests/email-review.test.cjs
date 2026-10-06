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
    const rows = () => (tables[table] ?? []).filter(r => filters.every(f => f(r)))
    const run = () => {
      if (op === 'upsert') { const existing = tables[table].find(r => r.user_id === payload.user_id && r.destinatario === payload.destinatario); if (existing) Object.assign(existing, payload); else tables[table].push(payload); return { data: null, error: null } }
      if (op === 'delete') { const hit = rows(); tables[table] = tables[table].filter(r => !hit.includes(r)); return { data: null, error: null } }
      if (op === 'insert') { const added = [].concat(payload).map(r => ({ id: nextId++, ...r })); tables[table].push(...added); return { data: added, error: null } }
      if (op === 'update') { const hit = rows(); hit.forEach(r => Object.assign(r, payload)); return { data: returning ? (single ? hit[0] ?? null : hit) : null, error: null } }
      const hit = rows(); return { data: single ? hit[0] ?? null : hit, error: null }
    }
    const q = {
      select() { if (op !== 'select') returning = true; return q },
      update(v) { op = 'update'; payload = v; return q },
      insert(v) { op = 'insert'; payload = v; return q },
      upsert(v) { op = 'upsert'; payload = v; return q },
      delete() { op = 'delete'; return q },
      eq(k, v) { filters.push(r => r[k] === v); return q },
      in(k, v) { filters.push(r => v.includes(r[k])); return q },
      order() { return q },
      gte(k, v) { filters.push(r => r[k] >= v); return q },
      lte(k, v) { filters.push(r => r[k] <= v); return q },
      not(k, op, v) { filters.push(r => r[k] !== v); return q },
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
const { PATCH, PUT, GET } = require('../src/app/api/email-import/yahoo/route.ts')
Module._load = realLoad
const patch = body => PATCH(new Request('https://fixture.invalid/api/email-import/yahoo', { method: 'PATCH', body: JSON.stringify(body) }))
const put = body => PUT(new Request('https://fixture.invalid/api/email-import/yahoo', { method: 'PUT', body: JSON.stringify(body) }))
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

test('aceptar usa el alias privado del destinatario, conserva el correo y no confunde personas', async () => {
  const tables = {
    correo_consumo: [pending(1, { descripcion: 'Transferencia a PÉREZ   JUAN' }), pending(2, { descripcion: 'Deuna a PEREZ JUAN' }), pending(3, { descripcion: 'Transferencia a PEREZ JUAN CARLOS' })],
    correo_alias: [{ user_id: owner, destinatario: 'perez juan', alias: 'Gimnasio' }, { user_id: 'otro', destinatario: 'perez juan carlos', alias: 'Privado' }], gasto: [],
  }
  db = fakeDb(tables)
  const res = await patch({ aceptar: [1, 2, 3].map(id => ({ id, categoria_id: 1 })) })
  assert.equal(res.status, 200)
  assert.deepEqual(tables.gasto.map(g => g.descripcion), ['Gimnasio', 'Gimnasio', 'Transferencia a PEREZ JUAN CARLOS'])
  assert.equal(tables.correo_consumo[0].descripcion, 'Transferencia a PÉREZ   JUAN')
})

test('guardar como usa una razón por movimiento sin modificar el alias ni el correo', async () => {
  const tables = {
    correo_consumo: [pending(1, { descripcion: 'Transferencia a JUAN PEREZ' }), pending(2, { descripcion: 'Transferencia a JUAN PEREZ' }), pending(3, { descripcion: 'Transferencia a JUAN PEREZ' })],
    correo_alias: [{ user_id: owner, destinatario: 'juan perez', alias: 'Juan' }], gasto: [],
  }
  db = fakeDb(tables)
  const response = await patch({ aceptar: [{ id: 1, categoria_id: 1, descripcion: '  Almuerzo  ' }, { id: 2, categoria_id: 1, descripcion: 'Taxi' }, { id: 3, categoria_id: 1 }] })
  assert.equal(response.status, 200)
  assert.deepEqual(tables.gasto.map(g => g.descripcion), ['Almuerzo', 'Taxi', 'Juan'])
  assert.equal(tables.correo_alias[0].alias, 'Juan')
  assert.ok(tables.correo_consumo.every(r => r.descripcion === 'Transferencia a JUAN PEREZ'))
})

test('guardar como rechaza razones inválidas antes de consumir cualquier pendiente', async () => {
  for (const descripcion of ['', '   ', 42, null, 'x'.repeat(201)]) {
    const tables = { correo_consumo: [pending(1)], gasto: [] }
    db = fakeDb(tables)
    const response = await patch({ aceptar: [{ id: 1, categoria_id: 1, descripcion }] })
    assert.equal(response.status, 400)
    assert.equal(tables.correo_consumo[0].estado, 'pendiente')
    assert.equal(tables.gasto.length, 0)
  }
})

test('listar muestra el alias y permite buscarlo conservando el nombre bancario', async () => {
  const tables = { correo_consumo: [pending(1, { descripcion: 'Transferencia a JUAN PEREZ' })], correo_alias: [{ user_id: owner, destinatario: 'juan perez', alias: 'Gimnasio' }], gasto: [] }
  db = fakeDb(tables)
  const response = await GET(new Request('https://fixture.invalid/api/email-import/yahoo?tab=nuevos&q=Gimnasio'))
  const body = await response.json()
  assert.equal(body.total, 1)
  assert.deepEqual([body.pendientes[0].descripcion, body.pendientes[0].descripcion_original, body.pendientes[0].alias], ['Gimnasio', 'Transferencia a JUAN PEREZ', 'Gimnasio'])
})

test('configurar, editar y quitar alias solo desde una transferencia propia', async () => {
  const tables = { correo_consumo: [pending(1, { descripcion: 'Transferencia a PÉREZ JUAN' }), pending(2, { user_id: 'otro', descripcion: 'Transferencia a OTRO' }), pending(3, { tipo: 'ingreso', descripcion: 'Recibido de PÉREZ JUAN' })], correo_alias: [], gasto: [] }
  db = fakeDb(tables)
  assert.equal((await put({ id: 1, alias: '  Gimnasio  ' })).status, 200)
  assert.deepEqual(tables.correo_alias, [{ user_id: owner, destinatario: 'perez juan', alias: 'Gimnasio' }])
  assert.equal((await put({ id: 1, alias: 'Entrenamiento' })).status, 200)
  assert.equal(tables.correo_alias.length, 1)
  assert.equal(tables.correo_alias[0].alias, 'Entrenamiento')
  tables.correo_consumo.push(pending(4, { descripcion: 'Deuna a PEREZ JUAN' }))
  assert.equal((await patch({ aceptar: [{ id: 4, categoria_id: 1 }] })).status, 200)
  assert.equal(tables.gasto[0].descripcion, 'Entrenamiento')
  assert.equal((await put({ id: 2, alias: 'Intruso' })).status, 404)
  assert.equal((await put({ id: 3, alias: 'Ingreso' })).status, 400)
  for (const body of [{ id: 1, alias: 'x'.repeat(201) }, { id: 1, alias: 10 }, { id: -1, alias: 'x' }]) assert.equal((await put(body)).status, 400)
  assert.equal((await put({ id: 1, alias: '' })).status, 200)
  assert.deepEqual(tables.correo_alias, [])
  assert.equal(tables.correo_consumo[0].descripcion, 'Transferencia a PÉREZ JUAN')
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

test('alias persiste por usuario, tiene límites y acceso cerrado (PostgreSQL aislado)', async () => {
  const { PGlite } = require('@electric-sql/pglite'), pg = new PGlite()
  try {
    await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;')
    const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261006_correo_alias.sql'), 'utf8')
    await pg.exec(sql)
    await pg.query("INSERT INTO public.correo_alias VALUES ('u', 'juan perez', 'Gimnasio'), ('v', 'juan perez', 'Otro alias')")
    await pg.exec(sql)
    assert.equal((await pg.query('SELECT * FROM public.correo_alias')).rows.length, 2)
    await assert.rejects(() => pg.query("INSERT INTO public.correo_alias VALUES ('u', 'juan perez', 'Duplicado')"), /duplicate|unique/)
    for (const alias of ['', '  ', 'x'.repeat(201)]) await assert.rejects(() => pg.query('INSERT INTO public.correo_alias VALUES ($1,$2,$3)', ['u', 'otro', alias]), /check/)
    for (const role of ['anon', 'authenticated']) {
      await pg.exec('SET ROLE ' + role)
      await assert.rejects(() => pg.query('SELECT * FROM public.correo_alias'), /permission denied/)
      await pg.exec('RESET ROLE')
    }
    await pg.exec('SET ROLE service_role')
    assert.equal((await pg.query('SELECT * FROM public.correo_alias')).rows.length, 2)
  } finally { await pg.close() }
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
