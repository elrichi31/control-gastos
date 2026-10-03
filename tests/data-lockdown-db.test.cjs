const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { PGlite } = require('@electric-sql/pglite')
const lock = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261007_lock_data_tables.sql'), 'utf8')
const TABLES = ['categoria', 'gasto', 'gasto_recurrente', 'gasto_recurrente_instancia', 'metodo_pago', 'movimiento_presupuesto', 'presupuesto_categoria', 'presupuesto_mensual']

test('PostgreSQL: data tables are closed to the public roles, even with a permissive policy, and open to service_role', async () => {
  const db = new PGlite()
  try {
    await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;')
    for (const t of TABLES) await db.exec(`CREATE TABLE ${t}(id int PRIMARY KEY, user_id text); INSERT INTO ${t} VALUES (1, 'victim'); GRANT ALL ON ${t} TO anon, authenticated, service_role;`)
    // Mirrors production: a leftover "allow everything" policy on an RLS-off table.
    await db.exec(`CREATE POLICY open_all ON gasto FOR ALL TO PUBLIC USING (true) WITH CHECK (true);`)
    await db.exec(lock)
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`SET ROLE ${role}`)
      for (const t of TABLES) {
        await assert.rejects(() => db.query(`SELECT * FROM ${t}`), /permission denied/, `${role} can read ${t}`)
        await assert.rejects(() => db.query(`UPDATE ${t} SET user_id='x'`), /permission denied/, `${role} can update ${t}`)
        await assert.rejects(() => db.query(`INSERT INTO ${t} VALUES (2, 'x')`), /permission denied/, `${role} can insert ${t}`)
      }
      await db.exec('RESET ROLE')
    }
    const rls = (await db.query(`SELECT bool_and(relrowsecurity) AS on FROM pg_class WHERE relname = ANY($1)`, [TABLES])).rows[0].on
    assert.equal(rls, true)
    // service_role bypasses RLS in Supabase (BYPASSRLS); emulate it to prove the grants are in place.
    await db.exec('ALTER ROLE service_role BYPASSRLS; SET ROLE service_role')
    for (const t of TABLES) assert.equal((await db.query(`SELECT count(*)::int AS n FROM ${t}`)).rows[0].n, 1)
    await db.exec('RESET ROLE')
    await db.exec(lock) // re-applying is safe
  } finally { await db.close() }
})

test('server data access never goes back to the public anon client', () => {
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)])
  const files = [...walk(path.join(__dirname, '../src/app/api')), ...walk(path.join(__dirname, '../src/lib/auth'))].filter(f => /\.tsx?$/.test(f))
  const offenders = files.filter(f => /database\/server|createServerClient|from ['"]@\/lib\/database['"]/.test(fs.readFileSync(f, 'utf8')))
  assert.deepEqual(offenders.map(f => path.relative(path.join(__dirname, '..'), f)), [], 'These files reach the locked tables with the anon key')
})

test('PostgreSQL: legacy and trigger functions are not executable by the public roles', async () => {
  const db = new PGlite()
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE TABLE t(id int, updated_at timestamptz);
      CREATE FUNCTION procesar_gastos_recurrentes_pendientes() RETURNS int LANGUAGE sql AS 'SELECT 1';
      CREATE FUNCTION generar_instancias_gasto_especifico(p_id bigint, p_desde date) RETURNS int LANGUAGE sql AS 'SELECT 1';
      CREATE FUNCTION update_updated_at_column() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN NEW.updated_at := now(); RETURN NEW; END';
      CREATE TRIGGER touch BEFORE UPDATE ON t FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE FUNCTION app_today() RETURNS date LANGUAGE sql AS 'SELECT current_date';
      GRANT ALL ON t TO anon;`)
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261008_revoke_public_functions.sql'), 'utf8'))
    await db.exec('SET ROLE anon')
    await assert.rejects(() => db.query('SELECT procesar_gastos_recurrentes_pendientes()'), /permission denied/)
    await assert.rejects(() => db.query("SELECT generar_instancias_gasto_especifico(1, '2026-01-01')"), /permission denied/, 'every overload is revoked')
    assert.ok((await db.query('SELECT app_today() AS d')).rows[0].d, 'harmless calendar helpers stay callable')
    await db.query('INSERT INTO t VALUES (1, NULL)')
    await db.query('UPDATE t SET id = 2') // triggers still fire for a role with table access
    await db.exec('RESET ROLE')
    assert.ok((await db.query('SELECT updated_at FROM t')).rows[0].updated_at)
  } finally { await db.close() }
})
