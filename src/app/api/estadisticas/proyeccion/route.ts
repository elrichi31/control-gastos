import { NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/lib/auth'
import { buildExpenseForecast, isForecastDate, type ForecastExpense } from '@/lib/expense-forecast'
import type { PlanningRule } from '@/lib/month-planning'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }
const PAGE_SIZE = 500

/** Private, bounded history read. Never compute a forecast from a truncated page. */
export async function GET(request: Request) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient(request)
  if (authError) return authError
  const today = new URL(request.url).searchParams.get('today') || ''
  if (!isForecastDate(today)) return NextResponse.json({ error: 'Fecha inválida' }, { status: 400, headers })
  const [year, month] = today.split('-').map(Number)
  const since = new Date(Date.UTC(year, month - 10, 1)).toISOString().slice(0, 10)
  const until = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10)
  try {
    const readExpenses = async () => {
      const all: ForecastExpense[] = []
      for (let page = 0; page < 100; page++) {
        const { data, error } = await supabase.from('gasto')
          .select('id, fecha, monto, is_recurrent, gasto_recurrente_id')
          .eq('user_id', userId).gte('fecha', since).lt('fecha', until)
          .order('id', { ascending: true }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        if (error || !data) throw new Error('history')
        all.push(...data)
        if (data.length < PAGE_SIZE) return all
      }
      throw new Error('history limit')
    }
    const readRules = async () => {
      const all: PlanningRule[] = []
      for (let page = 0; page < 100; page++) {
        const { data, error } = await supabase.from('gasto_recurrente').select('*')
          .eq('user_id', userId).order('id', { ascending: true }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        if (error || !data) throw new Error('rules')
        all.push(...data)
        if (data.length < PAGE_SIZE) return all
      }
      throw new Error('rules limit')
    }
    const [expenses, rules] = await Promise.all([readExpenses(), readRules()])
    return NextResponse.json(buildExpenseForecast({ today, expenses, rules }), { headers })
  } catch {
    return NextResponse.json({ error: 'No se pudo calcular la proyección con el historial y los recurrentes completos. Reintenta.' }, { status: 500, headers })
  }
}
