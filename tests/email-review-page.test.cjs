require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { pageReviewRows, parseReviewQuery, REVIEW_PAGE_SIZE } = require('../src/lib/email-review-page.ts')

const row = (id, extra = {}) => ({ id, tipo: 'gasto', descripcion: `Compra ${id}`, origen: 'Banco', fecha: '2026-10-01', coincidencias: [], ...extra })
const q = (search) => parseReviewQuery(new URL(`https://fixture.invalid/x?${search}`))
const rows = [
  ...Array.from({ length: 120 }, (_, i) => row(i + 1)),
  ...Array.from({ length: 7 }, (_, i) => row(200 + i, { coincidencias: [{}] })),
  row(300, { tipo: 'ingreso', coincidencias: [{}] }),
]

test('counts every tab but returns one page of the requested one', () => {
  const page = pageReviewRows(rows, q('tab=nuevos&page=2'))
  assert.deepEqual(page.counts, { nuevos: 120, duplicados: 7, recibidos: 1 })
  assert.equal(page.rows.length, REVIEW_PAGE_SIZE)
  assert.equal(page.rows[0].id, REVIEW_PAGE_SIZE + 1)
  assert.equal(page.pages, 3)
  assert.equal(pageReviewRows(rows, q('tab=duplicados')).rows.length, 7)
})
test('clamps out-of-range pages and ignores garbage params', () => {
  const page = pageReviewRows(rows, q('tab=nope&page=99'))
  assert.equal(page.page, 3)
  assert.equal(page.rows.length, 20)
  assert.equal(parseReviewQuery(new URL('https://f.invalid/?page=-4')).page, 1)
})
test('search filters inside the tab; "otro gasto" moves a duplicate to the top of Nuevos', () => {
  assert.equal(pageReviewRows(rows, q('tab=nuevos&q=COMPRA 11')).total, 11)
  const page = pageReviewRows(rows, q('tab=nuevos&otros=203'))
  assert.equal(page.counts.duplicados, 6)
  assert.equal(page.rows[0].id, 203)
})
