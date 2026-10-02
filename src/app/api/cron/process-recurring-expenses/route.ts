import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'node:crypto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// A daily Dokploy schedule invokes this job. All scheduling and writes happen in one SQL transaction.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'Falta configurar CRON_SECRET' }, { status: 503 })
  const received = Buffer.from(request.headers.get('authorization') || '')
  const expected = Buffer.from(`Bearer ${secret}`)
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || key === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Falta configurar el acceso privado a Supabase' }, { status: 503 })
  }
  try {
    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }) },
    })
    const { data, error } = await db.rpc('process_recurring_expenses', { p_limit: 200 })
    if (error) {
      console.error('[recurring-cron] RPC failed', { code: error.code })
      const missing = ['PGRST202', '42883'].includes(error.code)
      return NextResponse.json({ error: missing ? 'Falta aplicar la migración de gastos recurrentes en Supabase' : 'No se pudieron generar los gastos recurrentes' }, { status: missing ? 503 : 500 })
    }
    if (!data) return NextResponse.json({ error: 'Respuesta inválida del procesador' }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    console.error('[recurring-cron] Request failed')
    return NextResponse.json({ error: 'No se pudieron generar los gastos recurrentes' }, { status: 500 })
  }
}
