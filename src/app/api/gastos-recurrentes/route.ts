import { NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/lib/auth/auth-supabase'
import { validateRecurringRule, publicRecurringRule, recurringDatabaseError, recurringRequestError } from '@/lib/recurring-rules'

export async function GET(request: Request) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient(request)
  if (authError) return authError
  const { data, error } = await supabase.from('gasto_recurrente').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Error al obtener gastos recurrentes' }, { status: 500 })
  return NextResponse.json((data || []).map(publicRecurringRule))
}

// Only persist the rule. The SQL trigger schedules it; the single cron generates expenses.
export async function POST(request: Request) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient(request)
  if (authError) return authError
  try {
    const rule = validateRecurringRule(await request.json())
    const { data, error } = await supabase.from('gasto_recurrente')
      .insert({ ...rule, user_id: userId, proxima_fecha: null, ultima_fecha_generada: null })
      .select().single()
    // Explicit new columns also prevent partial creation before the migration is applied.
    if (error) return recurringDatabaseError(error)
    return NextResponse.json(publicRecurringRule(data), { status: 201 })
  } catch (error) { return recurringRequestError(error) }
}
