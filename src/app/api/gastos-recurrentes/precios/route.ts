import { NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/lib/auth/auth-supabase'
import { createServiceClient } from '@/lib/database/service'
import { fetchPriceHistory, RecurringActionError } from '@/lib/recurring-actions'

// GET - Historial de cambios de monto de los gastos recurrentes propios (solo web)
export async function GET(request: Request) {
  const { error: authError, userId } = await getAuthenticatedSupabaseClient(request)
  if (authError) return authError
  const db = createServiceClient()
  if (!db) return NextResponse.json({ error: 'Falta configurar el acceso privado a Supabase' }, { status: 503 })
  try {
    return NextResponse.json(await fetchPriceHistory(db, userId!), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const status = error instanceof RecurringActionError ? error.status : 500
    return NextResponse.json({ error: 'No se pudo consultar el historial de precios' }, { status })
  }
}
