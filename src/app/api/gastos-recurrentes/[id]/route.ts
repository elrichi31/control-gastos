import { NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/lib/auth/auth-supabase'
import { validateRecurringRule, publicRecurringRule, RecurringValidationError, recurringDatabaseError, recurringRequestError } from '@/lib/recurring-rules'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient(request)
  if (authError) return authError
  try {
    const { id: idParam } = await params
    const id = Number(idParam)
    if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    const body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RecurringValidationError('Datos recurrentes inválidos')
    const { data: existing, error: fetchError } = await supabase.from('gasto_recurrente').select('*').eq('id', id).eq('user_id', userId).single()
    if (fetchError) {
      if (fetchError.code === 'PGRST116') return NextResponse.json({ error: 'Gasto recurrente no encontrado' }, { status: 404 })
      return recurringDatabaseError(fetchError)
    }
    if (!existing) return NextResponse.json({ error: 'Gasto recurrente no encontrado' }, { status: 404 })
    if (!('proxima_fecha' in existing) || !('ultima_fecha_generada' in existing)) return recurringDatabaseError({ code: 'PGRST204' })
    const validated = validateRecurringRule({ ...existing, ...body })
    const updateData: Record<string, unknown> = {}
    for (const key of Object.keys(validated) as (keyof typeof validated)[]) {
      if (body[key] !== undefined) updateData[key] = validated[key]
    }
    if (body.frecuencia !== undefined) {
      updateData.dia_semana = validated.dia_semana
      updateData.dia_mes = validated.dia_mes
      updateData.mes_anual = validated.mes_anual
    }
    if (!Object.keys(updateData).length) return NextResponse.json(publicRecurringRule(existing))
    // Never write cursors from a stale read; SQL recalculates calendar edits atomically.
    const { data, error } = await supabase.from('gasto_recurrente').update(updateData).eq('id', id).eq('user_id', userId).select().single()
    if (error) return recurringDatabaseError(error)
    return NextResponse.json(publicRecurringRule(data))
  } catch (error) { return recurringRequestError(error) }
}

// DELETE - Eliminar un gasto recurrente
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient(request)
  if (authError) return authError

  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Verificar que el gasto recurrente pertenece al usuario antes de eliminar
    const { data: existing, error: fetchError } = await supabase
      .from('gasto_recurrente')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Gasto recurrente no encontrado' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('gasto_recurrente')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting recurring expense:', error)
      return NextResponse.json(
        { error: 'Error al eliminar gasto recurrente' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/gastos-recurrentes/[id]:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
