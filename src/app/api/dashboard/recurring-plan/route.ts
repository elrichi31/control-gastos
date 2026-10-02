import { NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/lib/auth/auth-supabase'
import { publicRecurringRule } from '@/lib/recurring-rules'

// Dedicated web read: leave existing web/mobile expense response contracts unchanged.
export async function GET(request: Request) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient(request)
  if (authError) return authError
  const month = new URL(request.url).searchParams.get('month') || ''
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return NextResponse.json({ error: 'Mes inválido' }, { status: 400 })
  const [year, number] = month.split('-').map(Number)
  const next = number === 12 ? `${year + 1}-01-01` : `${year}-${String(number + 1).padStart(2, '0')}-01`
  try {
    const [rules, links] = await Promise.all([
      supabase.from('gasto_recurrente').select('*').eq('user_id', userId),
      supabase.from('gasto').select('id, gasto_recurrente_id').eq('user_id', userId)
        .gte('fecha', `${month}-01`).lt('fecha', next).not('gasto_recurrente_id', 'is', null),
    ])
    const error = rules.error || links.error
    if (error) {
      const missingMigration = ['42703', 'PGRST204'].includes(error.code || '')
      return NextResponse.json({ error: missingMigration ? 'Falta aplicar la migración de recurrentes para calcular los compromisos.' : 'No se pudieron cargar los compromisos.' }, { status: missingMigration ? 503 : 500, headers: { 'Cache-Control': 'no-store' } })
    }
    return NextResponse.json({ rules: (rules.data || []).map(row => ({ ...publicRecurringRule(row), proxima_fecha: row.proxima_fecha, ultima_fecha_generada: row.ultima_fecha_generada })), links: links.data || [] }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'No se pudieron cargar los compromisos.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
