import { NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { getAuthenticatedSupabaseClient } from '@/lib/auth'
import { predictExpenseSelection } from '@/lib/expense-suggestions'
import { categorizeWithJev } from '@/lib/jev'
import { AUTO_EXPENSE_TAG } from '@/lib/expense-tags'
import { BANK_SENDERS, categoryByRules, classifyEmail, normalizeName, parseBankEmail, type PaymentKind } from '@/lib/bank-emails'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

// ponytail: fecha fija pedida para la primera importación; los Message-ID ya vistos se saltan.
const IMPORT_SINCE = new Date('2026-01-01T00:00:00-05:00')
// Enviados, borradores, papelera y spam no traen consumos válidos.
const SKIPPED_FOLDERS = new Set(['\\Sent', '\\Drafts', '\\Trash', '\\Junk'])

// Las credenciales de Yahoo son del dueño de la cuenta, así que solo ese usuario puede importar.
function configuredFor(userId: string) {
  const { YAHOO_EMAIL, YAHOO_APP_PASSWORD, YAHOO_IMPORT_USER_ID } = process.env
  return Boolean(YAHOO_EMAIL && YAHOO_APP_PASSWORD && YAHOO_IMPORT_USER_ID === userId)
}

const missingMigration = (code?: string) => code === '42P01' || code === 'PGRST205'
function dbFailure(where: string, code?: string) {
  console.error(`[yahoo-import] ${where} failed`, { code })
  return missingMigration(code)
    ? NextResponse.json({ error: 'Falta aplicar la migración de importación de correo en Supabase' }, { status: 503 })
    : NextResponse.json({ error: 'No se pudieron procesar tus consumos' }, { status: 500 })
}

async function authorize(request: Request) {
  const auth = await getAuthenticatedSupabaseClient(request)
  if (auth.error) return { error: auth.error } as const
  if (!configuredFor(auth.userId)) return { error: NextResponse.json({ error: 'Importación de Yahoo no habilitada para esta cuenta' }, { status: 403 }) } as const
  return { supabase: auth.supabase, userId: auth.userId } as const
}

/** Estado y consumos pendientes de revisión. */
export async function GET(request: Request) {
  const auth = await getAuthenticatedSupabaseClient(request)
  if (auth.error) return auth.error
  if (!configuredFor(auth.userId)) return NextResponse.json({ enabled: false, pendientes: [] })
  const { data, error } = await auth.supabase.from('correo_consumo')
    .select('id, origen, fecha, descripcion, monto, categoria_id, metodo_pago_id')
    .eq('user_id', auth.userId).eq('estado', 'pendiente')
    .order('fecha', { ascending: false })
  if (error) return dbFailure('list', error.code)
  return NextResponse.json({ enabled: true, pendientes: data })
}

/** Lee el correo y guarda los consumos nuevos como pendientes. No crea gastos. */
export async function POST(request: Request) {
  const auth = await authorize(request)
  if ('error' in auth) return auth.error
  const { supabase, userId } = auth

  const [categorias, metodos, historial, vistos] = await Promise.all([
    supabase.from('categoria').select('id, nombre'),
    supabase.from('metodo_pago').select('id, nombre'),
    supabase.from('gasto').select('descripcion, categoria_id, metodo_pago_id').eq('user_id', userId).order('fecha', { ascending: false }).limit(500),
    supabase.from('correo_consumo').select('email_message_id').eq('user_id', userId),
  ])
  const readError = categorias.error || metodos.error || historial.error || vistos.error
  if (readError) return dbFailure('read', readError.code)

  const cats = categorias.data ?? []
  const pays = metodos.data ?? []
  const catByName = new Map(cats.map(c => [normalizeName(c.nombre), c.id as number]))
  const fallbackCat = catByName.get('otros') ?? cats[0]?.id
  const payFor = (kind: PaymentKind) => {
    const find = (word: string) => pays.find(p => normalizeName(p.nombre).includes(word))?.id
    return find(kind) ?? (kind === 'transferencia' ? undefined : find('tarjeta')) ?? pays[0]?.id
  }
  if (!fallbackCat || !pays.length) return NextResponse.json({ error: 'Faltan categorías o métodos de pago en el catálogo' }, { status: 500 })
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
        const uids = await client.search({ since: IMPORT_SINCE, or: BANK_SENDERS.map(from => ({ from })) }, { uid: true }) || []
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
          const predicted = predictExpenseSelection(charge.descripcion, historial.data ?? [], cats, pays).categoryId
          const ruled = categoryByRules(charge.descripcion)
          const categoria = predicted ? Number(predicted) : ruled ? catByName.get(ruled) : undefined
          // Consumos con tarjeta sin coincidencia: se le preguntan a Jev al final, todos juntos.
          if (!categoria && !charge.transfer) askJev.push(rows.length)
          rows.push({
            user_id: userId,
            email_message_id: msg.envelope.messageId,
            origen: charge.origen,
            fecha: charge.fecha,
            descripcion: charge.descripcion,
            monto: charge.monto,
            categoria_id: categoria ?? fallbackCat,
            metodo_pago_id: payFor(charge.metodo),
          })
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
    return NextResponse.json({ error: authFailed ? 'Yahoo rechazó la contraseña de aplicación' : 'No se pudo leer el correo de Yahoo' }, { status: 502 })
  }

  if (askJev.length) {
    // Solo el nombre del comercio sale hacia TypeSafe; nunca montos ni transferencias a personas.
    const jev = await categorizeWithJev(askJev.map(i => rows[i].descripcion as string), cats)
    for (const i of askJev) rows[i].categoria_id = jev.get(rows[i].descripcion as string) ?? fallbackCat
  }
  if (rows.length) {
    const { error } = await supabase.from('correo_consumo').upsert(rows, { onConflict: 'user_id,email_message_id', ignoreDuplicates: true })
    if (error) return dbFailure('insert', error.code)
  }
  return NextResponse.json({ nuevos: rows.length })
}

const ids = (value: unknown) => Array.isArray(value) ? value.filter((v): v is number => Number.isInteger(v) && v > 0) : []

/** Acepta (crea el gasto con tag "auto") o descarta consumos pendientes. */
export async function PATCH(request: Request) {
  const auth = await authorize(request)
  if ('error' in auth) return auth.error
  const { supabase, userId } = auth
  const body = await request.json().catch(() => null)
  const categoriaPor = new Map<number, number>()
  for (const item of Array.isArray(body?.aceptar) ? body.aceptar : []) {
    if (Number.isInteger(item?.id) && Number.isInteger(item?.categoria_id)) categoriaPor.set(item.id, item.categoria_id)
  }
  const aceptar = [...categoriaPor.keys()]
  const descartar = ids(body?.descartar).filter(id => !categoriaPor.has(id))
  if (!aceptar.length && !descartar.length) return NextResponse.json({ error: 'No hay consumos seleccionados' }, { status: 400 })

  let aceptados = 0
  if (aceptar.length) {
    // Marcar primero (solo los que siguen pendientes) evita crear el mismo gasto dos veces.
    const { data: claimed, error } = await supabase.from('correo_consumo')
      .update({ estado: 'aceptado' })
      .eq('user_id', userId).eq('estado', 'pendiente').in('id', aceptar)
      .select('id, fecha, descripcion, monto, categoria_id, metodo_pago_id')
    if (error) return dbFailure('claim', error.code)
    if (claimed?.length) {
      const gastos = claimed.map(row => ({
        user_id: userId,
        descripcion: row.descripcion,
        monto: row.monto,
        fecha: row.fecha,
        categoria_id: categoriaPor.get(row.id) ?? row.categoria_id,
        metodo_pago_id: row.metodo_pago_id,
        is_recurrent: false,
        tags: [AUTO_EXPENSE_TAG],
      }))
      const { error: insertError } = await supabase.from('gasto').insert(gastos)
      if (insertError) {
        await supabase.from('correo_consumo').update({ estado: 'pendiente' }).eq('user_id', userId).in('id', claimed.map(row => row.id))
        return dbFailure('create expenses', insertError.code)
      }
      aceptados = claimed.length
    }
  }
  let descartados = 0
  if (descartar.length) {
    const { data, error } = await supabase.from('correo_consumo')
      .update({ estado: 'descartado' })
      .eq('user_id', userId).eq('estado', 'pendiente').in('id', descartar)
      .select('id')
    if (error) return dbFailure('discard', error.code)
    descartados = data?.length ?? 0
  }
  return NextResponse.json({ aceptados, descartados })
}
