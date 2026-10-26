require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')
const load = Module._load
Module._load = function(name, ...args) {
  if (name === 'next/navigation') return { redirect(url) { throw { redirect: url } } }
  return load.call(this, name, ...args)
}
const { default: FormPage } = require('../src/app/form/page.tsx')
Module._load = load

test('old form bookmarks open the shared dialog with the correct expense type', async () => {
  for (const [tipo, expected] of [[undefined, 'normal'], ['recurrente', 'recurrente'], ['unknown', 'normal'], [['recurrente'], 'normal']]) {
    await assert.rejects(FormPage({ searchParams: Promise.resolve({ tipo }) }), error => error.redirect === `/dashboard?gasto=${expected}`)
  }
})
test('PWA shortcuts open the modal instead of the removed entry screen', () => {
  const manifest = require('../public/manifest.json')
  assert.deepEqual(manifest.shortcuts.map(shortcut => shortcut.url), ['/dashboard?gasto=normal', '/dashboard?gasto=recurrente'])
})

test('the modal consumes a deep link without navigating or removing other filters and the hash', () => {
  const React = require('react')
  const originalEffect = React.useEffect, originalContext = React.useContext
  const previousWindow = global.window
  const effects = [], opened = [], urls = []
  const params = new URLSearchParams('gasto=recurrente&filtro=mes')
  const originalLoad = Module._load
  Module._load = function(name, ...args) {
    if (name === 'next/navigation') return { usePathname: () => '/dashboard', useSearchParams: () => params }
    return originalLoad.call(this, name, ...args)
  }
  let ExpenseDialogHost
  try { ({ ExpenseDialogHost } = require('../src/components/gastos/ExpenseDialogHost.tsx')) }
  finally { Module._load = originalLoad }
  React.useEffect = effect => effects.push(effect)
  React.useContext = () => ({ request: null, openExpense: kind => opened.push(kind), closeExpense() {}, restoreFocus() {} })
  global.window = { location: { hash: '#lista' }, history: { replaceState: (_state, _title, url) => urls.push(url) } }
  try {
    assert.equal(ExpenseDialogHost(), null)
    effects[0]()
    assert.deepEqual(opened, ['recurrente'])
    assert.deepEqual(urls, ['/dashboard?filtro=mes#lista'])
    params.set('gasto', 'invalid')
    effects[0]()
    assert.equal(opened.length, 1)
    assert.equal(urls.length, 1)
  } finally {
    React.useEffect = originalEffect; React.useContext = originalContext
    if (previousWindow === undefined) delete global.window; else global.window = previousWindow
  }
})
