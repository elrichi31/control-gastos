require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
let createEmailReviewQueue
try { ({ createEmailReviewQueue } = require('../src/lib/email-review-queue.ts')) } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e }
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b }); return { promise, resolve, reject } }
test('enqueue gives immediate feedback, serializes saves and rejects rapid double clicks', async () => {
  assert.equal(typeof createEmailReviewQueue, 'function', 'review queue is not implemented')
  const first = deferred(), second = deferred(), calls = [], notices = [], states = []
  const queue = createEmailReviewQueue({ onChange: jobs => states.push(jobs), onFeedback: job => notices.push([job.id, job.status]) })
  assert.equal(queue.enqueue({ id: 1, label: 'Almuerzo', execute: () => { calls.push(1); return first.promise } }), true)
  assert.equal(queue.enqueue({ id: 1, label: 'Duplicado', execute: () => { calls.push('duplicate') } }), false)
  queue.enqueue({ id: 2, label: 'Taxi', execute: () => { calls.push(2); return second.promise } })
  assert.deepEqual(calls, [1]); assert.ok(notices.some(([id, state]) => id === 2 && state === 'queued'))
  assert.ok(!notices.some(([, state]) => state === 'success'))
  first.resolve(); await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(calls, [1, 2]); assert.ok(notices.some(([id, state]) => id === 1 && state === 'success'))
  assert.equal(queue.pendingCount(), 1)
  second.resolve(); await queue.whenIdle()
  assert.equal(queue.pendingCount(), 0); assert.equal(states.at(-1).filter(j => j.status === 'success').length, 2)
})
test('a failed save is exposed and the next task still runs without automatic retry', async () => {
  assert.equal(typeof createEmailReviewQueue, 'function', 'review queue is not implemented')
  const first = deferred(), calls = [], feedback = []
  const queue = createEmailReviewQueue({ onFeedback: job => feedback.push(job) })
  queue.enqueue({ id: 1, label: 'Almuerzo', execute: () => { calls.push(1); return first.promise } })
  queue.enqueue({ id: 2, label: 'Taxi', execute: async () => { calls.push(2) } })
  first.reject(new Error('Sin conexión')); await queue.whenIdle()
  assert.deepEqual(calls, [1, 2]); assert.equal(feedback.find(j => j.status === 'error').error, 'Sin conexión')
  assert.equal(queue.snapshot().find(j => j.id === 1).status, 'error')
  assert.equal(queue.snapshot().find(j => j.id === 2).status, 'success')
})
test('payload closures capture choices at click time and drain notification runs once per batch', async () => {
  assert.equal(typeof createEmailReviewQueue, 'function', 'review queue is not implemented')
  const gate = deferred(); let drains = 0, amount = 12; const sent = []
  const queue = createEmailReviewQueue({ onIdle: () => { drains++ } })
  queue.enqueue({ id: 1, label: 'Primero', execute: () => gate.promise })
  const captured = amount
  queue.enqueue({ id: 2, label: 'Segundo', execute: async () => { sent.push(captured) } })
  amount = 24; gate.resolve(); await queue.whenIdle()
  assert.deepEqual(sent, [12]); assert.equal(drains, 1)
})

test('SPA remount subscribes to the same queue and cannot send the same ID again', async () => {
  const { createSessionEmailReviewQueue } = require('../src/lib/email-review-queue.ts')
  assert.equal(typeof createSessionEmailReviewQueue, 'function', 'session queue is not implemented')
  const gate = deferred(), calls = [], session = createSessionEmailReviewQueue()
  let firstView, secondView
  const unmount = session.subscribe({ onChange: jobs => { firstView = jobs } })
  session.enqueue({ id: 10, label: 'Compra', execute: () => { calls.push(10); return gate.promise } })
  unmount()
  const unsubscribe = session.subscribe({ onChange: jobs => { secondView = jobs } })
  assert.equal(secondView[0].status, 'saving')
  assert.equal(session.enqueue({ id: 10, label: 'Duplicado', execute: async () => { calls.push('duplicate') } }), false)
  gate.resolve(); await session.whenIdle()
  assert.deepEqual(calls, [10]); assert.equal(firstView[0].status, 'saving'); assert.equal(secondView[0].status, 'success')
  unsubscribe()
})
test('closing warning survives unmount and is removed only when financial writes drain', async () => {
  const { createSessionEmailReviewQueue } = require('../src/lib/email-review-queue.ts')
  assert.equal(typeof createSessionEmailReviewQueue, 'function', 'session queue is not implemented')
  const originalWindow = global.window, listeners = new Map(), gate = deferred()
  global.window = { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name) } }
  try {
    const session = createSessionEmailReviewQueue(), unmount = session.subscribe({ onChange() {} })
    session.enqueue({ id: 11, label: 'Compra', execute: () => gate.promise }); unmount()
    assert.equal(typeof listeners.get('beforeunload'), 'function')
    let warned = false; listeners.get('beforeunload')({ preventDefault: () => { warned = true } }); assert.equal(warned, true)
    gate.resolve(); await session.whenIdle(); assert.equal(listeners.has('beforeunload'), false)
  } finally { if (originalWindow === undefined) delete global.window; else global.window = originalWindow }
})
