import { NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/lib/auth/auth-supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  try {
    const { id: idParam } = await params
    const gastoId = parseInt(idParam)

    if (isNaN(gastoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Buscar la instancia asociada a este gasto
    const { data: instancia, error: instanciaError } = await supabase
      .from('gasto_recurrente_instancia')
      .select('gasto_recurrente_id')
      .eq('gasto_id', gastoId)
      .single()

    if (instanciaError || !instancia) {
      return NextResponse.json({ gasto_recurrente_id: null })
    }

    // Verificar que el gasto recurrente pertenece al usuario
    const { data: gastoRecurrente, error: recurrenteError } = await supabase
      .from('gasto_recurrente')
      .select('id')
      .eq('id', instancia.gasto_recurrente_id)
      .eq('user_id', userId)
      .single()

    if (recurrenteError || !gastoRecurrente) {
      return NextResponse.json({ gasto_recurrente_id: null })
    }

    return NextResponse.json({
      gasto_recurrente_id: instancia.gasto_recurrente_id
    })
  } catch (error) {
    console.error('Error getting recurring expense info:', error)
    return NextResponse.json(
      { error: 'Error al obtener información del gasto recurrente' },
      { status: 500 }
    )
  }
}
