import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createServiceClient } from '@/lib/database/service'
import { isMissingMigration, syncYahoo, yahooImportUserId } from '@/lib/email-sync'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

// Un schedule de Dokploy lo llama cada 30 min. Solo mira las últimas 2 semanas: lo anterior
// ya lo trajo la sincronización completa del botón, y los Message-ID repetidos se ignoran.
const WINDOW_DAYS = 14

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'Falta configurar CRON_SECRET' }, { status: 503 })
  const received = Buffer.from(request.headers.get('authorization') || '')
  const expected = Buffer.from(`Bearer ${secret}`)
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const userId = yahooImportUserId()
  if (!userId) return NextResponse.json({ error: 'Importación de Yahoo no configurada' }, { status: 503 })
  const supabase = createServiceClient()
  if (!supabase) return NextResponse.json({ error: 'Falta configurar el acceso privado a Supabase' }, { status: 503 })

  const result = await syncYahoo(supabase, userId, new Date(Date.now() - WINDOW_DAYS * 86_400_000))
  if (!result.ok) {
    console.error('[email-cron] sync failed', { error: result.error, code: result.code })
    const missing = isMissingMigration(result.code)
    return NextResponse.json({ error: missing ? 'Faltan las migraciones de importación de correo' : result.db ? 'No se pudo sincronizar' : result.error }, { status: missing ? 503 : result.status })
  }
  return NextResponse.json({ nuevos: result.nuevos })
}
