// Lista correos de Yahoo que coinciden con un término, para conocer el formato de cada banco.
// Uso: node --env-file=.env.local scripts/yahoo-probe.mjs [termino] [dias]
// Guarda el texto de los últimos 5 en .yahoo-samples/ (ignorado por git: contiene datos personales).
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { mkdirSync, writeFileSync } from 'node:fs'

const { YAHOO_EMAIL, YAHOO_APP_PASSWORD } = process.env
if (!YAHOO_EMAIL || !YAHOO_APP_PASSWORD) {
  console.error('Falta YAHOO_EMAIL o YAHOO_APP_PASSWORD en .env.local')
  process.exit(1)
}
const term = process.argv[2] || 'consumo'
const days = Number(process.argv[3] || 90)

const client = new ImapFlow({
  host: 'imap.mail.yahoo.com', port: 993, secure: true,
  auth: { user: YAHOO_EMAIL, pass: YAHOO_APP_PASSWORD }, logger: false,
})
await client.connect()
const lock = await client.getMailboxLock('INBOX')
try {
  const uids = await client.search({ since: new Date(Date.now() - days * 864e5), or: [{ subject: term }, { body: term }] }, { uid: true })
  console.log(`${uids.length} correos con "${term}" en ${days} días`)
  const senders = {}
  for await (const msg of client.fetch(uids, { envelope: true }, { uid: true })) {
    const from = msg.envelope.from?.[0]?.address ?? '?'
    senders[from] = (senders[from] ?? 0) + 1
    console.log(msg.envelope.date?.toISOString().slice(0, 10), from, '|', msg.envelope.subject)
  }
  console.log('\nRemitentes:', senders)
  mkdirSync('.yahoo-samples', { recursive: true })
  for (const uid of uids.slice(-5)) {
    const { source } = await client.fetchOne(String(uid), { source: true }, { uid: true })
    const mail = await simpleParser(source)
    writeFileSync(`.yahoo-samples/${uid}.txt`, `From: ${mail.from?.text}\nSubject: ${mail.subject}\nDate: ${mail.date?.toISOString()}\n\n${mail.text ?? mail.html ?? ''}`)
  }
  console.log('Muestras guardadas en .yahoo-samples/')
} finally {
  lock.release()
  await client.logout()
}
