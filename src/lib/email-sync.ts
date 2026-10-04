import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import type { createServiceClient } from '@/lib/database/service'
import { predictExpenseSelection } from '@/lib/expense-suggestions'
import { categorizeWithJev } from '@/lib/jev'
import { BANK_SENDERS, categoryByRules, classifyEmail, normalizeName, parseBankEmail, type PaymentKind } from '@/lib/bank-emails'

type Db = NonNullable<ReturnType<typeof createServiceClient>>
export type SyncResult = { ok: true; nuevos: number } | { ok: false; status: number; error: string; db?: boolean; code?: string }

// Enviados, borradores, papelera y spam no traen consumos válidos.
const SKIPPED_FOLDERS = new Set(['\\Sent', '\\Drafts', '\\Trash', '\\Junk'])

// Las credenciales de Yahoo son del dueño de la cuenta, así que solo ese usuario puede importar.
export function yahooImportUserId() {
  const { YAHOO_EMAIL, YAHOO_APP_PASSWORD, YAHOO_IMPORT_USER_ID } = process.env
  return YAHOO_EMAIL && YAHOO_APP_PASSWORD && YAHOO_IMPORT_USER_ID ? YAHOO_IMPORT_USER_ID : null
}

export const isMissingMigration = (code?: string) => code === '42P01' || code === 'PGRST205' || code === '42703' || code === 'PGRST204'

/** Lee el correo desde `since` y guarda los movimientos nuevos como pendientes. No crea gastos. */
export async function syncYahoo(supabase: Db, userId: string, since: Date): Promise<SyncResult> {
  const [categorias, metodos, historial, vistos] = await Promise.all([
    supabase.from('categoria').select('id, nombre'),
    supabase.from('metodo_pago').select('id, nombre'),
    supabase.from('gasto').select('descripcion, categoria_id, metodo_pago_id').eq('user_id', userId).order('fecha', { ascending: false }).limit(500),
    supabase.from('correo_consumo').select('email_message_id').eq('user_id', userId).gte('fecha', since.toISOString().slice(0, 10)),
  ])
  const readError = categorias.error || metodos.error || historial.error || vistos.error
  if (readError) return { ok: false, status: 500, error: 'read', db: true, code: readError.code }

  const cats = categorias.data ?? []
  const pays = metodos.data ?? []
  const catByName = new Map(cats.map(c => [normalizeName(c.nombre), c.id as number]))
  const fallbackCat = catByName.get('otros') ?? cats[0]?.id
  const payFor = (kind: PaymentKind) => {
    const find = (word: string) => pays.find(p => normalizeName(p.nombre).includes(word))?.id
    return find(kind) ?? (kind === 'transferencia' ? undefined : find('tarjeta')) ?? pays[0]?.id
  }
  if (!fallbackCat || !pays.length) return { ok: false, status: 500, error: 'Faltan categorías o métodos de pago en el catálogo' }
  const seen = new Set((vistos.data ?? []).map(row => row.email_message_id as string))

  const client = new ImapFlow({
    host: 'imap.mail.yahoo.com', port: 993, secure: true, logger: false,
    auth: { user: process.env.YAHOO_EMAIL!, pass: process.env.YAHOO_APP_PASSWORD! },
  })
  const rows: Record<string, unknown>[] = []
  const askJev: number[] = []
  try {
    await client.connect()
    for (const box of await client.list()) {
      if (box.flags.has('\\Noselect') || (box.specialUse && SKIPPED_FOLDERS.has(box.specialUse))) continue
      const lock = await client.getMailboxLock(box.path)
      try {
        const uids = await client.search({ since, or: BANK_SENDERS.map(from => ({ from })) }, { uid: true }) || []
        // Primero solo cabeceras: el cuerpo se baja únicamente para correos nuevos y relevantes.
        const wanted: number[] = []
        if (uids.length) {
          for await (const msg of client.fetch(uids, { envelope: true }, { uid: true })) {
            const id = msg.envelope?.messageId
            if (!id || seen.has(id) || !classifyEmail(msg.envelope?.from?.[0]?.address ?? '', msg.envelope?.subject ?? '')) continue
            seen.add(id) // el mismo correo puede estar copiado en dos carpetas
            wanted.push(msg.uid)
          }
        }
        if (!wanted.length) continue
        for await (const msg of client.fetch(wanted, { source: true, envelope: true }, { uid: true })) {
          if (!msg.source || !msg.envelope?.messageId) continue
          const mail = await simpleParser(msg.source)
          const source = classifyEmail(mail.from?.value?.[0]?.address ?? '', mail.subject ?? '')
          const charge = source && mail.html && mail.date ? parseBankEmail(source, mail.subject ?? '', mail.html, mail.date) : null
          if (!charge) continue
          const row: Record<string, unknown> = {
            user_id: userId,
            email_message_id: msg.envelope.messageId,
            tipo: charge.tipo,
            origen: charge.origen,
            fecha: charge.fecha,
            descripcion: charge.descripcion,
            monto: charge.monto,
            categoria_id: null,
            metodo_pago_id: payFor(charge.metodo),
          }
          if (charge.tipo === 'gasto') {
            const predicted = predictExpenseSelection(charge.descripcion, historial.data ?? [], cats, pays).categoryId
            const ruled = categoryByRules(charge.descripcion)
            const categoria = predicted ? Number(predicted) : ruled ? catByName.get(ruled) : undefined
            // Consumos con tarjeta sin coincidencia: se le preguntan a Jev al final, todos juntos.
            if (!categoria && !charge.transfer) askJev.push(rows.length)
            row.categoria_id = categoria ?? fallbackCat
          }
          rows.push(row)
        }
      } finally {
        lock.release()
      }
    }
    await client.logout()
  } catch (error) {
    client.close()
    const authFailed = (error as { authenticationFailed?: boolean }).authenticationFailed
    console.error('[yahoo-import] IMAP failed', { authFailed })
    return { ok: false, status: 502, error: authFailed ? 'Yahoo rechazó la contraseña de aplicación' : 'No se pudo leer el correo de Yahoo' }
  }

  if (askJev.length) {
    // Solo el nombre del comercio sale hacia TypeSafe; nunca montos ni transferencias a personas.
    const jev = await categorizeWithJev(askJev.map(i => rows[i].descripcion as string), cats)
    for (const i of askJev) rows[i].categoria_id = jev.get(rows[i].descripcion as string) ?? fallbackCat
  }
  if (rows.length) {
    // ignoreDuplicates: el cron y el botón pueden coincidir sin duplicar filas.
    const { error } = await supabase.from('correo_consumo').upsert(rows, { onConflict: 'user_id,email_message_id', ignoreDuplicates: true })
    if (error) return { ok: false, status: 500, error: 'insert', db: true, code: error.code }
  }
  return { ok: true, nuevos: rows.length }
}
