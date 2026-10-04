require('./helpers/register-ts.cjs')
const test = require('node:test')
const assert = require('node:assert/strict')
const { categorizeWithJev } = require('../src/lib/jev.ts')

const cats = [{ id: 1, nombre: 'Alimentación' }, { id: 2, nombre: 'Transporte' }, { id: 9, nombre: 'Otros' }]
const realFetch = global.fetch
function withFetch(impl, fn) {
  const saved = process.env.TYPESAFE_API_KEY
  process.env.TYPESAFE_API_KEY = 'synthetic-key'
  global.fetch = impl
  return fn().finally(() => { global.fetch = realFetch; if (saved === undefined) delete process.env.TYPESAFE_API_KEY; else process.env.TYPESAFE_API_KEY = saved })
}

test('usa la elección de Jev solo con confianza suficiente y un solo request por lote', async () => {
  let calls = 0, sent
  await withFetch(async (_url, init) => {
    calls++; sent = JSON.parse(init.body)
    return new Response(JSON.stringify({ answers: {
      c0: { type: 'choice', choice: 'Alimentación', confidence: 0.96 },
      c1: { type: 'choice', choice: 'Transporte', confidence: 0.43 },
    } }), { status: 200 })
  }, async () => {
    const result = await categorizeWithJev(['POLLO CAMPERO', 'HOLAFLY LIMITED', 'POLLO CAMPERO'], cats)
    assert.equal(calls, 1)
    assert.deepEqual(Object.values(sent.state.comercios), ['POLLO CAMPERO', 'HOLAFLY LIMITED'])
    assert.deepEqual([...result], [['POLLO CAMPERO', 1]])
  })
})

test('duplicados: veredicto de Jev y orden (encaja > desconocido); solo descripciones salen', async () => {
  let sent
  await withFetch(async (_url, init) => {
    sent = JSON.parse(init.body)
    return new Response(JSON.stringify({ answers: {
      p0: { type: 'choice', choice: 'no_encaja', probabilities: { encaja: 0.09, desconocido: 0.04, no_encaja: 0.87 } },
      p1: { type: 'choice', choice: 'desconocido', probabilities: { encaja: 0, desconocido: 0.9, no_encaja: 0.1 } },
    } }), { status: 200 })
  }, async () => {
    const { scoreSameExpense } = require('../src/lib/jev.ts')
    const [gas, transfer] = await scoreSameExpense([
      { correo: { descripcion: 'PETROCOMERCIAL' }, gasto: { descripcion: 'Almuerzo' } },
      { correo: { descripcion: 'Transferencia a Juan' }, gasto: { descripcion: 'Cyrano' } },
    ])
    assert.equal(gas.veredicto, 'no_encaja')
    assert.deepEqual([transfer.veredicto, transfer.probabilidad], ['desconocido', 0.45])
    assert.doesNotMatch(JSON.stringify(sent.state), /monto|fecha/)
  })
})

test('sin key o con error de la API no bloquea la importación', async () => {
  const saved = process.env.TYPESAFE_API_KEY
  delete process.env.TYPESAFE_API_KEY
  assert.equal((await categorizeWithJev(['X'], cats)).size, 0)
  if (saved !== undefined) process.env.TYPESAFE_API_KEY = saved
  await withFetch(async () => new Response('{}', { status: 529 }), async () => {
    assert.equal((await categorizeWithJev(['X'], cats)).size, 0)
  })
  await withFetch(async () => { throw new Error('network') }, async () => {
    assert.equal((await categorizeWithJev(['X'], cats)).size, 0)
  })
})
