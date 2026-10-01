import { NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/lib/auth/auth-supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient(request)
  if (authError) return authError

  try {
    const { id: idParam } = await params
    const gastoId = parseInt(idParam)

    if (isNaN(gastoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // New expenses link directly to the rule. Read the owned expense before any legacy lookup.
    const { data: gasto, error: gastoError } = await supabase
      .from('gasto')
      .select('*')
      .eq('id', gastoId)
      .eq('user_id', userId)
      .single()
    if (gastoError || !gasto) {
      return NextResponse.json({ gasto_recurrente_id: null })
    }
    let recurringId = gasto.gasto_recurrente_id
    if (!recurringId) {
      // Preserve compatibility for old instances, including historical duplicate expenses.
      const { data: instancias, error: instanciaError } = await supabase
        .from('gasto_recurrente_instancia')
        .select('gasto_recurrente_id')
        .eq('gasto_id', gastoId)
      if (instanciaError || !instancias?.length) return NextResponse.json({ gasto_recurrente_id: null })
      const ids = [...new Set(instancias.map(instance => instance.gasto_recurrente_id))]
      if (ids.length !== 1 || !ids[0]) return NextResponse.json({ gasto_recurrente_id: null })
      recurringId = ids[0]
    }

    // Verificar que el gasto recurrente pertenece al usuario
    const { data: gastoRecurrente, error: recurrenteError } = await supabase
      .from('gasto_recurrente')
      .select('id')
      .eq('id', recurringId)
      .eq('user_id', userId)
      .single()

    if (recurrenteError || !gastoRecurrente) {
      return NextResponse.json({ gasto_recurrente_id: null })
    }

    return NextResponse.json({
      gasto_recurrente_id: recurringId
    })
  } catch (error) {
    console.error('Error getting recurring expense info:', error)
    return NextResponse.json(
      { error: 'Error al obtener información del gasto recurrente' },
      { status: 500 }
    )
  }
}
