import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/shared/lib/auth-supabase'

// GET: Obtener un presupuesto mensual específico por ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Falta el parámetro id' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('presupuesto_mensual')
    .select('id, anio, mes, total, gastos_registrados, tendencia, estado')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
  
  return NextResponse.json(data)
}
