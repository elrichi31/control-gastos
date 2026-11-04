require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { DeleteExpenseButton } = require('../src/components/gastos/DeleteExpenseButton.tsx')
const { AlertDialog, AlertDialogAction } = require('../src/components/ui/alert-dialog.tsx')

// Walks the authored element tree (not the rendered DOM) to find the handlers
// our component attaches, the same approach tests/expense-tags-interaction.test.cjs uses.
function elements(node) { if (!node || typeof node !== 'object') return []; return [node, ...React.Children.toArray(node.props?.children).flatMap(elements)] }

async function harness(run) {
  const originalUseState = React.useState
  const originalUseRef = React.useRef
  let slots = [], refs = [], index = 0, refIndex = 0
  React.useState = initial => { const key = index++; if (!(key in slots)) slots[key] = typeof initial === 'function' ? initial() : initial; return [slots[key], value => { slots[key] = typeof value === 'function' ? value(slots[key]) : value }] }
  // Refs keep the same object identity across renders (unlike slots, which are read fresh each call),
  // so a synchronous mutation made during one invocation is visible to a second invocation in the same tick.
  React.useRef = initial => { const key = refIndex++; if (!(key in refs)) refs[key] = { current: initial }; return refs[key] }
  const render = fn => { index = 0; refIndex = 0; return fn() }
  try { await run({ slots, refs, render }) } finally { React.useState = originalUseState; React.useRef = originalUseRef }
}

test('renders a labeled trigger and does not call onConfirm before any interaction', async () => {
  await harness(async ({ slots, render }) => {
    let calls = 0
    const comp = () => DeleteExpenseButton({ descripcion: 'Café', onConfirm: () => { calls++ } })
    const tree = render(comp)
    assert.equal(slots[0], false, 'dialog starts closed')
    assert.equal(calls, 0)
    const trigger = elements(tree).find(n => n.props?.['aria-label'] === 'Eliminar gasto: Café')
    assert.ok(trigger, 'the row exposes a labeled delete trigger')
  })
})

test('closing the dialog (cancel) never calls onConfirm', async () => {
  await harness(async ({ slots, render }) => {
    let calls = 0
    const comp = () => DeleteExpenseButton({ descripcion: 'Café', onConfirm: () => { calls++ } })
    slots[0] = true
    const tree = render(comp)
    const root = elements(tree).find(n => n.type === AlertDialog)
    root.props.onOpenChange(false)
    assert.equal(slots[0], false)
    assert.equal(calls, 0)
  })
})

test('confirming deletes once; two synchronous invocations of the same click, before any re-render, still delete once', async () => {
  await harness(async ({ slots, refs, render }) => {
    let calls = 0, resolveDelete
    const onConfirm = () => new Promise(resolve => { calls++; resolveDelete = resolve })
    const comp = () => DeleteExpenseButton({ descripcion: 'Café', onConfirm })

    const tree1 = render(comp)
    const action1 = elements(tree1).find(n => n.type === AlertDialogAction)
    // Fire the SAME handler closure twice back-to-back, with no render in between —
    // this is what a double click (or React's automatic batching) looks like: both
    // calls happen in the same tick, before setIsDeleting's update is observable via
    // useState. A guard that only reads the isDeleting state snapshot would miss this;
    // the ref (refs[0]) is mutated synchronously and is shared across both invocations.
    const pending1 = action1.props.onClick({ preventDefault() {} })
    assert.equal(refs[0].current, true, 'the ref guard is set synchronously before the await')
    const pending2 = action1.props.onClick({ preventDefault() {} })
    assert.equal(calls, 1, 'the second synchronous invocation did not trigger another delete')
    assert.equal(slots[1], true, 'isDeleting reflects the in-flight request')

    resolveDelete()
    await pending1
    await pending2
    assert.equal(slots[0], false, 'dialog closes after a successful delete')
    assert.equal(slots[1], false, 'isDeleting resets after the request settles')
    assert.equal(refs[0].current, false, 'the ref guard releases after the request settles')
  })
})

test('a click while the request is in flight (after a re-render) is still ignored', async () => {
  await harness(async ({ slots, render }) => {
    let calls = 0, resolveDelete
    const onConfirm = () => new Promise(resolve => { calls++; resolveDelete = resolve })
    const comp = () => DeleteExpenseButton({ descripcion: 'Café', onConfirm })

    const tree1 = render(comp)
    const action1 = elements(tree1).find(n => n.type === AlertDialogAction)
    const pending = action1.props.onClick({ preventDefault() {} })
    assert.equal(calls, 1)
    assert.equal(slots[1], true, 'isDeleting guards against a second submit')

    const tree2 = render(comp)
    const action2 = elements(tree2).find(n => n.type === AlertDialogAction)
    await action2.props.onClick({ preventDefault() {} })
    assert.equal(calls, 1, 'the concurrent second click did not trigger another delete')

    resolveDelete()
    await pending
    assert.equal(slots[0], false, 'dialog closes after a successful delete')
    assert.equal(slots[1], false, 'isDeleting resets after the request settles')
  })
})

test('a failed delete keeps the dialog open and re-enables the action for a retry', async () => {
  await harness(async ({ slots, render }) => {
    let calls = 0
    const onConfirm = () => { calls++; return Promise.reject(new Error('network error')) }
    const comp = () => DeleteExpenseButton({ descripcion: 'Café', onConfirm })
    slots[0] = true
    const tree = render(comp)
    const action = elements(tree).find(n => n.type === AlertDialogAction)
    await action.props.onClick({ preventDefault() {} })
    assert.equal(calls, 1)
    assert.equal(slots[0], true, 'dialog stays open on failure so the user can retry')
    assert.equal(slots[1], false, 'isDeleting resets so the retry click is not blocked')
  })
})
