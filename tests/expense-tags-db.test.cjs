const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { PGlite } = require('@electric-sql/pglite')
const file = path.join(__dirname, '../supabase/migrations/20261009_expense_tags.sql')
test('PostgreSQL: optional tags preserve history and persist on both expense tables; migration reapplies safely', async () => {
  const db = new PGlite()
  try {
    await db.exec("CREATE TABLE gasto(id int PRIMARY KEY, descripcion text); CREATE TABLE movimiento_presupuesto(id int PRIMARY KEY, descripcion text); INSERT INTO gasto VALUES(1, 'Histórico'); INSERT INTO movimiento_presupuesto VALUES(1, 'Histórico');")
    const sql = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
    if (sql) await db.exec(sql)
    const columns = (await db.query("SELECT table_name FROM information_schema.columns WHERE column_name='tags'")).rows
    assert.deepEqual(columns.map(x => x.table_name).sort(), ['gasto', 'movimiento_presupuesto'])
    for (const table of ['gasto', 'movimiento_presupuesto']) {
      assert.deepEqual((await db.query(`SELECT tags FROM ${table} WHERE id=1`)).rows[0].tags, [])
      await db.query(`UPDATE ${table} SET tags=$1 WHERE id=1`, [['viaje', 'familia']])
      await db.exec(sql)
      assert.deepEqual((await db.query(`SELECT tags FROM ${table} WHERE id=1`)).rows[0].tags, ['viaje', 'familia'])
      await db.exec(`INSERT INTO ${table}(id, descripcion) VALUES(2, 'Sin tags')`)
      assert.deepEqual((await db.query(`SELECT tags FROM ${table} WHERE id=2`)).rows[0].tags, [])
      await assert.rejects(db.query(`UPDATE ${table} SET tags=$1 WHERE id=1`, [Array.from({length:11}, (_,i)=>`tag${i}`)]), /check constraint/)
      await assert.rejects(db.query(`UPDATE ${table} SET tags=$1 WHERE id=1`, [['x'.repeat(31)]]), /check constraint/)
      await assert.rejects(db.query(`UPDATE ${table} SET tags=NULL WHERE id=1`), /not-null constraint/)
    }
  } finally { await db.close() }
})
