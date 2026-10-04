require('./helpers/register-ts.cjs')
const test = require('node:test')
const assert = require('node:assert/strict')
const { classifyEmail, parseBankEmail, parseAmount, categoryByRules } = require('../src/lib/bank-emails.ts')

// Fixtures sintéticos con la misma forma (una celda por línea) que los correos reales.
const html = (...cells) => `<html><head><style>p{margin:0}</style></head><body><table>${cells.map(c => `<tr><td><p>${c}</p></td></tr>`).join('')}</table></body></html>`
const date = new Date('2026-09-19T03:30:00Z') // 18 sep en Ecuador
const parse = (from, subject, body) => parseBankEmail(classifyEmail(from, subject), subject, body, date)

test('parseAmount entiende punto o coma decimal y miles', () => {
  assert.equal(parseAmount('32,72'), 32.72)
  assert.equal(parseAmount('$8.50'), 8.5)
  assert.equal(parseAmount('1.234,56'), 1234.56)
  assert.equal(parseAmount('USD 4'), 4)
  assert.equal(parseAmount('$3,50 USD'), 3.5)
  assert.equal(parseAmount('0,00'), null)
})

test('clasifica por remitente y asunto sin bajar el cuerpo', () => {
  assert.equal(classifyEmail('bancaenlinea@produbanco.com', 'Consumo Tarjeta de Crédito por USD 29.24').metodo, 'credito')
  assert.equal(classifyEmail('bancaenlinea@produbanco.com', 'Consumo tarjeta de débito por USD 5.00').metodo, 'debito')
  assert.equal(classifyEmail('bancaenlinea@produbanco.com', 'Gana un viaje a Noruega'), null)
  assert.equal(classifyEmail('notificaciones@deunaapp.com', '¡Listo! Recargaste $20 en tu cuenta Deuna ✅'), null)
  assert.equal(classifyEmail('otro@banco.com', 'Notificación de Consumos'), null)
})

test('Diners: establecimiento y valor; la fecha sale del correo en hora de Ecuador', () => {
  const r = parse('servicios@dinersclub.com.ec', 'Notificación de Consumos', html('&iexcl;Hola, CLIENTE PRUEBA!', 'TARJETA TERMINADA EN', '000', 'Fecha', '2026-09-18 22:30', 'Establecimiento', 'ESTACION DE SERVICIO', 'Valor', '32,72'))
  assert.deepEqual([r.fecha, r.descripcion, r.monto, r.metodo], ['2026-09-18', 'ESTACION DE SERVICIO', 32.72, 'credito'])
})

test('Produbanco: monto desde el asunto y establecimiento en línea aparte', () => {
  const r = parse('bancaenlinea@produbanco.com', 'Consumo Tarjeta de Crédito por USD 1,250.00', html('Estimado/a', 'CLIENTE PRUEBA', 'Valor: USD', '1,250.00', 'Establecimiento:', 'SUPERMAXI SAN GABRIE'))
  assert.equal(r.monto, 1250)
  assert.equal(r.descripcion, 'SUPERMAXI SAN GABRIE')
})

test('Pichincha "Transferencia exitosa": columnas mezcladas', () => {
  const r = parse('banco@pichincha.com', 'NOTIFICACIÓN BANCO PICHINCHA', html('Ana Maria Prueba Lopez', 'Tu cédula termina en: ******* 0000', '¡Transferencia exitosa!', 'Hola, Ana Maria Prueba Lopez,', 'Detalle de la transacción', 'Monto:', 'Concepto', '3.50', 'Cuenta destino', 'Nombre:', 'Número de cuenta:', 'PEREZ GOMEZ JUAN CARLOS', '******0023'))
  assert.equal(r.monto, 3.5)
  assert.equal(r.descripcion, 'Transferencia a PEREZ GOMEZ JUAN CARLOS')
})

test('Deuna: pago a un tercero', () => {
  const r = parse('notificaciones@deunaapp.com', '¡Listo! Bazar recibió tus $0,90 ✅', html('Ana Maria Prueba Lopez', 'Pagaste $0,90 a', 'Monto', '$0,90 USD', 'Nombre del beneficiario', 'Bazar Y Novedades'))
  assert.deepEqual([r.monto, r.descripcion, r.origen], [0.9, 'Deuna a Bazar Y Novedades', 'Deuna'])
})

test('ignora transferencias propias y fallidas', () => {
  const owner = 'PRUEBA LOPEZ ANA MARIA'
  assert.equal(parse('banco@pichincha.com', 'NOTIFICACION BANCO PICHINCHA', html('Banco Pichincha', 'Transferencia', owner, 'Tu transferencia se realizó con éxito.', 'Detalle', 'Nombre del beneficiario:', 'Ana Maria Prueba Lopez', 'Monto:', 'USD 350.00')), null)
  assert.equal(parse('banco@pichincha.com', 'NOTIFICACION BANCO PICHINCHA', html('Banco Pichincha', owner, 'La transferencia no se realizó.', 'Nombre del beneficiario:', 'Juan Perez', 'Monto:', 'USD 40')), null)
  // Produbanco: dinero que te mandas a ti mismo desde otra cuenta.
  assert.equal(parse('bancaenlinea@produbanco.com', 'Transferencia recibida desde Produbanco', html('Estimado/a', owner, 'Enviada por:', 'Ana Maria Prueba Lopez', 'Monto:', '$400.00')), null)
})

test('dinero recibido de otra persona es un ingreso', () => {
  const pichincha = parse('banco@pichincha.com', 'NOTIFICACION BANCO PICHINCHA', html('Banco Pichincha', 'Transferencia recibida', 'Estimado/a PRUEBA LOPEZ ANA MARIA', 'Acabas de recibir una transferencia.', 'Nombre del ordenante:', 'Juan Perez', 'Monto:', 'USD 10,00'))
  assert.deepEqual([pichincha.tipo, pichincha.descripcion, pichincha.monto], ['ingreso', 'Recibido de Juan Perez', 10])
  const deuna = parse('notificaciones@deunaapp.com', '¡Recibiste $5,00 en tu cuenta Deuna! 🤑', html('Hola, Ana 💸', 'Recibiste $5,00 de', 'Monto', '$5,00 USD', 'Nombre del ordenante', 'Martin Aldas'))
  assert.deepEqual([deuna.tipo, deuna.descripcion, deuna.monto], ['ingreso', 'Recibido de Martin Aldas', 5])
})

test('"Transferencia Ingresada" de Produbanco es un gasto enviado, no un ingreso', () => {
  const r = parse('bancaenlinea@produbanco.com', 'Transferencia Ingresada desde Produbanco', html('Estimado/a', 'PRUEBA LOPEZ ANA MARIA', 'Beneficiario:', 'PEREZ JUAN', 'Monto:', '$1600.00'))
  assert.deepEqual([r.tipo, r.descripcion, r.monto], ['gasto', 'Transferencia a PEREZ JUAN', 1600])
})

test('categoriza por palabra sin importar tildes y sin falsos positivos', () => {
  assert.equal(categoryByRules('ESTACION DE SERVICIO'), 'transporte')
  assert.equal(categoryByRules('CLÍNICA VETERINARIA'), 'salud')
  assert.equal(categoryByRules('UB EATS ECUADOR\\Vijz'), 'alimentacion')
  assert.equal(categoryByRules('UBER *ONE MEMBERSH'), 'transporte')
  assert.equal(categoryByRules('ACADEMIA DE BAILE'), null)
})
