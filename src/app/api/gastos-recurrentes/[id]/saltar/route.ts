import { NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/lib/auth/auth-supabase'
import { createServiceClient } from '@/lib/database/service'
import { RecurringActionError, skipNextOccurrence } from '@/lib/recurring-actions'

// POST - Saltar solo el próximo cobro, sin pausar la regla
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, userId } = await getAuthenticatedSupabaseClient(request)
  if (authError) return authError
  const id = Number((await params).id)
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  const db = createServiceClient()
  if (!db) return NextResponse.json({ error: 'Falta configurar el acceso privado a Supabase' }, { status: 503 })
  try {
    return NextResponse.json(await skipNextOccurrence(db, userId!, id), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof RecurringActionError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'No se pudo saltar el cobro' }, { status: 500 })
  }
}
