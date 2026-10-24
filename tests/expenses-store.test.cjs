require('./helpers/register-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { QueryObserver } = require('@tanstack/react-query')
const { createQueryClient, queryKeys, invalidateExpenseData } = require('../src/lib/query/client.ts')

const expense = id => ({ id, monto: 10 })

test('concurrent consumers share one download and reuse fresh data', async () => {
  const client = createQueryClient(); let calls = 0
  const options = { queryKey: queryKeys.expenses, queryFn: async () => { calls++; return [expense(1)] } }
  try {
    const [a, b] = await Promise.all([client.fetchQuery(options), client.fetchQuery(options)])
    assert.equal(calls, 1); assert.deepEqual(a, b)
    await client.fetchQuery(options); assert.equal(calls, 1)
  } finally { client.clear() }
})

test('mutation invalidation updates active expenses, budget and month plan and marks inactive queries stale', async () => {
  const client = createQueryClient(); let id = 1
  const observers = [queryKeys.expenses, queryKeys.monthPlan, queryKeys.budgets].map(queryKey => new QueryObserver(client, {
    queryKey, queryFn: async () => [expense(id)], retry: false,
  }))
  const unsubscribers = observers.map(observer => observer.subscribe(() => {}))
  try {
    await Promise.all(observers.map(observer => observer.refetch()))
    client.setQueryData(queryKeys.forecast, { total: 10 })
    id = 2; await invalidateExpenseData(client)
    for (const observer of observers) assert.equal(observer.getCurrentResult().data[0].id, 2)
    assert.equal(client.getQueryState(queryKeys.forecast).isInvalidated, true)
  } finally { unsubscribers.forEach(unsubscribe => unsubscribe()); client.clear() }
})

test('a failed refresh retains previous expenses and exposes an error', async () => {
  const client = createQueryClient(); let fail = false
  const observer = new QueryObserver(client, { queryKey: queryKeys.expenses, retry: false,
    queryFn: async () => { if (fail) throw new Error('sin red'); return [expense(1)] } })
  const unsubscribe = observer.subscribe(() => {})
  try {
    await observer.refetch(); fail = true; await observer.refetch()
    assert.deepEqual(observer.getCurrentResult().data, [expense(1)])
    assert.equal(observer.getCurrentResult().error.message, 'sin red')
  } finally { unsubscribe(); client.clear() }
})

test('clearing a previous session cancels its request and cannot populate another session', async () => {
  const old = createQueryClient(), current = createQueryClient()
  let release, signal
  const pending = old.fetchQuery({ queryKey: queryKeys.expenses, queryFn: context => {
    signal = context.signal; return new Promise(resolve => { release = resolve })
  } }).catch(() => {})
  old.clear()
  assert.equal(signal.aborted, true)
  release([expense(9)]); await pending
  assert.equal(old.getQueryData(queryKeys.expenses), undefined)
  assert.equal(current.getQueryData(queryKeys.expenses), undefined)
  old.clear(); current.clear()
})
