import { NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/lib/auth'
import { scoreSameExpense } from '@/lib/jev'
import { AUTO_EXPENSE_TAG, MAX_EXPENSE_TAGS, SHARED_EXPENSE_TAG } from '@/lib/expense-tags'
import { computeForeignTax, parseForeignTaxInput, withForeignTag, type ForeignTaxState } from '@/lib/foreign-tax'
import { findCandidates, type Candidate, type ExistingExpense } from '@/lib/email-matches'
import { isMissingMigration, syncYahoo, yahooImportUserId } from '@/lib/email-sync'
import { pageReviewRows, parseReviewQuery } from '@/lib/email-review-page'
import { emailAliasDescription, transferRecipient } from '@/lib/email-aliases'
import { categoryFromHistory, normalizeName } from '@/lib/bank-emails'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

// ponytail: fecha fija pedida para la primera importación; los Message-ID ya vistos se saltan.
const IMPORT_SINCE = new Date('2026-01-01T00:00:00-05:00')

function dbFailure(where: string, code?: string) {
  console.error(`[yahoo-import] ${where} failed`, { code })
  return isMissingMigration(code)
    ? NextResponse.json({ error: 'Falta aplicar las migraciones de importación de correo en Supabase' }, { status: 503 })
    : NextResponse.json({ error: 'No se pudieron procesar tus consumos' }, { status: 500 })
}

async function authorize(request: Request) {
  const auth = await getAuthenticatedSupabaseClient(request)
  if (auth.error) return { error: auth.error } as const
  if (yahooImportUserId() !== auth.userId) return { error: NextResponse.json({ error: 'Importación de Yahoo no habilitada para esta cuenta' }, { status: 403 }) } as const
  return { supabase: auth.supabase, userId: auth.userId } as const
}

const shiftDate = (fecha: string, days: number) => new Date(Date.parse(fecha) + days * 86_400_000).toISOString().slice(0, 10)
const round2 = (n: number) => Math.round(n * 100) / 100

/** Una página de pendientes de la pestaña pedida (?tab, ?page, ?q, ?otros), con sus posibles
 *  duplicados y los contadores de cada pestaña. */
export async function GET(request: Request) {
  const auth = await getAuthenticatedSupabaseClient(request)
  if (auth.error) return auth.error
  if (yahooImportUserId() !== auth.userId) return NextResponse.json({ enabled: false, pendientes: [] })
  const { supabase, userId } = auth
  const url = new URL(request.url)
  if (url.searchParams.has('resumen')) {
    const { count, error } = await supabase.from('correo_consumo').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('estado', 'pendiente')
    if (error) return dbFailure('count', error.code)
    return NextResponse.json({ enabled: true, total: count ?? 0 })
  }
  const query = parseReviewQuery(url)
  const { data, error } = await supabase.from('correo_consumo')
    .select('id, tipo, origen, fecha, descripcion, monto, categoria_id, metodo_pago_id')
    .eq('user_id', userId).eq('estado', 'pendiente')
    .order('fecha', { ascending: false })
  if (error) return dbFailure('list', error.code)
  const [aliasResult, history, categories] = await Promise.all([
    supabase.from('correo_alias').select('destinatario, alias').eq('user_id', userId),
    supabase.from('gasto').select('descripcion, categoria_id').eq('user_id', userId)
      .order('fecha', { ascending: false }).order('id', { ascending: false }).limit(500),
    supabase.from('categoria').select('id'),
  ])
  const { data: aliases } = aliasResult
  const readError = aliasResult.error || history.error || categories.error
  if (readError) return dbFailure('review history', readError.code)
  const pendientes = (data ?? []).map(row => {
    const destinatario = row.tipo === 'gasto' ? transferRecipient(row.descripcion) : null
    const alias = destinatario ? (aliases ?? []).find(rule => rule.destinatario === destinatario)?.alias ?? '' : ''
    const category = row.tipo === 'gasto' ? categoryFromHistory(row.descripcion, history.data ?? [], categories.data ?? []) : undefined
    return { ...row, categoria_id: category ?? row.categoria_id, monto: Number(row.monto), descripcion_original: row.descripcion, descripcion: alias || row.descripcion, destinatario, alias }
  })
  if (!pendientes.length) return NextResponse.json({ enabled: true, pendientes: [], counts: { nuevos: 0, duplicados: 0, recibidos: 0 }, total: 0, page: 1, pages: 1 })

  const fechas = pendientes.map(p => p.fecha).sort()
  const [gastos, vinculados] = await Promise.all([
    supabase.from('gasto').select('id, descripcion, monto, fecha, tags, categoria (nombre)')
      .eq('user_id', userId).gte('fecha', shiftDate(fechas[0], -21)).lte('fecha', shiftDate(fechas[fechas.length - 1], 3)),
    supabase.from('correo_consumo').select('gasto_id').eq('user_id', userId).eq('tipo', 'gasto').not('gasto_id', 'is', null),
  ])
  if (gastos.error || vinculados.error) return dbFailure('matches', (gastos.error || vinculados.error)?.code)
  const yaVinculados = new Set((vinculados.data ?? []).map(row => row.gasto_id))
  const todos = (gastos.data ?? []).map(g => ({
    id: g.id, descripcion: g.descripcion, monto: Number(g.monto), fecha: g.fecha, tags: g.tags as string[] | null,
    categoria: (Array.isArray(g.categoria) ? g.categoria[0] : g.categoria) as ExistingExpense['categoria'],
  }))
  // Un duplicado solo puede ser un gasto manual que aún no esté vinculado a otro correo.
  // Un ingreso (te devolvieron) sí puede descontarse de un gasto importado.
  const manuales = todos.filter(g => !g.tags?.includes(AUTO_EXPENSE_TAG) && !yaVinculados.has(g.id))

  const withCandidates = pendientes.map(p => ({ ...p, coincidencias: findCandidates(p, p.tipo === 'ingreso' ? todos : manuales) as Candidate[] }))
  const page = pageReviewRows(withCandidates, query)
  // Jev (API externa, lenta) solo para los duplicados de esta página, no para todos.
  const pairs = page.rows.flatMap(p => p.tipo === 'gasto' ? p.coincidencias.map(c => ({ p, c })) : [])
  if (pairs.length) {
    const verdicts = await scoreSameExpense(pairs.map(({ p, c }) => ({
      correo: { descripcion: p.descripcion },
      gasto: { descripcion: c.gasto.descripcion, categoria: c.gasto.categoria?.nombre },
    })))
    pairs.forEach(({ c }, i) => { if (verdicts[i]) Object.assign(c, verdicts[i]) })
    for (const p of page.rows) {
      if (p.tipo !== 'gasto') continue
      // Mismo monto y día pero rubros distintos (gasolinera vs. "almuerzo"): coincidencia casual.
      // Se descarta solo si queda otra; si no, la fila sigue en Duplicados con el aviso de confirmar,
      // porque la pestaña se decidió antes de consultar a Jev.
      const plausibles = p.coincidencias.filter(c => c.veredicto !== 'no_encaja')
      p.coincidencias = (plausibles.length ? plausibles : p.coincidencias)
        .sort((a, b) => (b.probabilidad ?? 0) - (a.probabilidad ?? 0))
    }
  }
  return NextResponse.json({ enabled: true, pendientes: page.rows, counts: page.counts, total: page.total, page: page.page, pages: page.pages })
}

/** Lee el correo y guarda los movimientos nuevos como pendientes. No crea gastos. */
export async function POST(request: Request) {
  const auth = await authorize(request)
  if ('error' in auth) return auth.error
  const result = await syncYahoo(auth.supabase, auth.userId, IMPORT_SINCE)
  if (!result.ok) return result.db ? dbFailure(result.error, result.code) : NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ nuevos: result.nuevos })
}

/** Alias personal para el destinatario de un correo propio; vacío elimina la regla. */
export async function PUT(request: Request) {
  const auth = await authorize(request)
  if ('error' in auth) return auth.error
  const { supabase, userId } = auth
  const body = await request.json().catch(() => null)
  if (!Number.isSafeInteger(body?.id) || body.id <= 0 || typeof body?.alias !== 'string' || body.alias.trim().length > 200) {
    return NextResponse.json({ error: 'Indica un movimiento y un alias de hasta 200 caracteres' }, { status: 400 })
  }
  const { data: row, error } = await supabase.from('correo_consumo').select('tipo, descripcion')
    .eq('user_id', userId).eq('id', body.id).maybeSingle()
  if (error) return dbFailure('alias recipient', error.code)
  if (!row) return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 })
  const destinatario = row.tipo === 'gasto' ? transferRecipient(row.descripcion) : null
  if (!destinatario) return NextResponse.json({ error: 'Solo puedes asignar alias a transferencias enviadas' }, { status: 400 })
  const alias = body.alias.trim()
  const result = alias
    ? await supabase.from('correo_alias').upsert({ user_id: userId, destinatario, alias }, { onConflict: 'user_id,destinatario' })
    : await supabase.from('correo_alias').delete().eq('user_id', userId).eq('destinatario', destinatario)
  if (result.error) return dbFailure('save alias', result.error.code)
  return NextResponse.json({ destinatario, alias })
}

const ids = (value: unknown) => Array.isArray(value) ? value.filter((v): v is number => Number.isInteger(v) && v > 0) : []
const list = (value: unknown): Record<string, unknown>[] => Array.isArray(value) ? value.filter(v => v && typeof v === 'object') : []

/**
 * aceptar: crea el gasto (tag "auto"); con `monto` menor registras solo tu parte (tag "compartido").
 *   Con `impuestos` (compra en el exterior) se suman ISD/IVA sobre tu parte y se agrega el tag "exterior".
 * vincular: el movimiento ya existe como `gasto_id`. Si es un gasto, no se crea nada (duplicado);
 *   si es un ingreso, se descuenta de ese gasto (te devolvieron tu parte).
 * descartar: no es un gasto; no vuelve a aparecer.
 */
export async function PATCH(request: Request) {
  const auth = await authorize(request)
  if ('error' in auth) return auth.error
  const { supabase, userId } = auth
  const body = await request.json().catch(() => null)

  const aceptarPor = new Map<number, { categoria_id: number; monto?: number; descripcion?: string; impuestos?: ForeignTaxState }>()
  for (const item of list(body?.aceptar)) {
    if (!Number.isInteger(item.id) || !Number.isInteger(item.categoria_id)) continue
    if (item.descripcion !== undefined && (typeof item.descripcion !== 'string' || !item.descripcion.trim() || item.descripcion.trim().length > 200)) {
      return NextResponse.json({ error: 'Indica una razón de entre 1 y 200 caracteres en Guardar como' }, { status: 400 })
    }
    const impuestos = item.impuestos === undefined ? undefined : parseForeignTaxInput(item.impuestos)
    if (impuestos === null) return NextResponse.json({ error: 'Revisa los impuestos de la compra en el exterior' }, { status: 400 })
    const monto = typeof item.monto === 'number' && Number.isFinite(item.monto) ? round2(item.monto) : undefined
    aceptarPor.set(item.id as number, { categoria_id: item.categoria_id as number, monto, descripcion: typeof item.descripcion === 'string' ? item.descripcion.trim() || undefined : undefined, impuestos })
  }
  const vincular = list(body?.vincular).filter(v => Number.isInteger(v.id) && Number.isInteger(v.gasto_id)) as { id: number; gasto_id: number }[]
  const descartar = ids(body?.descartar)
  if (!aceptarPor.size && !vincular.length && !descartar.length) return NextResponse.json({ error: 'No hay movimientos seleccionados' }, { status: 400 })

  let aceptados = 0
  if (aceptarPor.size) {
    // Leer antes de reclamar: un fallo de configuración no debe consumir el pendiente.
    const { data: aliases, error: aliasError } = await supabase.from('correo_alias')
      .select('destinatario, alias').eq('user_id', userId)
    if (aliasError) return dbFailure('aliases', aliasError.code)
    // Marcar primero (solo los que siguen pendientes) evita crear el mismo gasto dos veces.
    const { data: claimed, error } = await supabase.from('correo_consumo')
      .update({ estado: 'aceptado' })
      .eq('user_id', userId).eq('estado', 'pendiente').eq('tipo', 'gasto').in('id', [...aceptarPor.keys()])
      .select('id, origen, fecha, descripcion, monto, categoria_id, metodo_pago_id')
    if (error) return dbFailure('claim', error.code)
    if (claimed?.length) {
      const gastos = claimed.map(row => {
        const choice = aceptarPor.get(row.id)!
        const total = Number(row.monto)
        const parte = choice.monto && choice.monto > 0 && choice.monto < total ? choice.monto : total
        // Los impuestos se calculan aquí sobre el monto del banco, no con un total que mande el cliente.
        const conImpuestos = choice.impuestos ? computeForeignTax(parte, choice.impuestos).total : parte
        return {
          user_id: userId,
          descripcion: choice.descripcion ?? emailAliasDescription(row.descripcion, aliases ?? []),
          monto: conImpuestos,
          fecha: row.fecha,
          categoria_id: choice.categoria_id ?? row.categoria_id,
          metodo_pago_id: row.metodo_pago_id,
          is_recurrent: false,
          tags: withForeignTag([AUTO_EXPENSE_TAG, ...(parte < total ? [SHARED_EXPENSE_TAG] : []), ...(row.origen ? [normalizeName(row.origen)] : [])], choice.impuestos ?? { enabled: false, selected: [], customRate: '' }, MAX_EXPENSE_TAGS),
        }
      })
      const { error: insertError } = await supabase.from('gasto').insert(gastos)
      if (insertError) {
        await supabase.from('correo_consumo').update({ estado: 'pendiente' }).eq('user_id', userId).in('id', claimed.map(row => row.id))
        return dbFailure('create expenses', insertError.code)
      }
      aceptados = claimed.length
    }
  }

  let vinculados = 0
  for (const { id, gasto_id } of vincular) {
    const { data: gasto } = await supabase.from('gasto').select('id, monto, tags').eq('id', gasto_id).eq('user_id', userId).maybeSingle()
    if (!gasto) continue
    const { data: row, error } = await supabase.from('correo_consumo')
      .update({ estado: 'vinculado', gasto_id })
      .eq('id', id).eq('user_id', userId).eq('estado', 'pendiente')
      .select('tipo, monto').maybeSingle()
    if (error) return dbFailure('link', error.code)
    if (!row) continue
    if (row.tipo === 'ingreso') {
      const restante = round2(Number(gasto.monto) - Number(row.monto))
      const tags: string[] = gasto.tags ?? []
      const nextTags = tags.includes(SHARED_EXPENSE_TAG) || tags.length >= MAX_EXPENSE_TAGS ? tags : [...tags, SHARED_EXPENSE_TAG]
      const { error: updateError } = restante > 0
        ? await supabase.from('gasto').update({ monto: restante, tags: nextTags }).eq('id', gasto_id).eq('user_id', userId)
        : { error: { code: 'amount' } }
      if (updateError) {
        await supabase.from('correo_consumo').update({ estado: 'pendiente', gasto_id: null }).eq('id', id).eq('user_id', userId)
        if (updateError.code === 'amount') return NextResponse.json({ error: 'Lo recibido no puede ser igual o mayor que el gasto' }, { status: 400 })
        return dbFailure('apply refund', updateError.code)
      }
    }
    vinculados++
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
  return NextResponse.json({ aceptados, vinculados, descartados })
}
