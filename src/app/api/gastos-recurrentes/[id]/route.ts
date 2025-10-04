import { NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/lib/auth/auth-supabase'

// PUT - Actualizar un gasto recurrente
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  try {
    const { id: idParam } = await params
    const body = await request.json()
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Verificar que el gasto recurrente pertenece al usuario
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

    // Actualizar solo los campos permitidos
    const updateData: any = {}
    
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion
    if (body.monto !== undefined) updateData.monto = body.monto
    if (body.categoria_id !== undefined) updateData.categoria_id = body.categoria_id
    if (body.metodo_pago_id !== undefined) updateData.metodo_pago_id = body.metodo_pago_id
    if (body.frecuencia !== undefined) updateData.frecuencia = body.frecuencia
    if (body.dia_semana !== undefined) updateData.dia_semana = body.dia_semana
    if (body.dia_mes !== undefined) updateData.dia_mes = body.dia_mes
    if (body.fecha_inicio !== undefined) updateData.fecha_inicio = body.fecha_inicio
    if (body.fecha_fin !== undefined) updateData.fecha_fin = body.fecha_fin
    if (body.activo !== undefined) updateData.activo = body.activo

    const { data, error } = await supabase
      .from('gasto_recurrente')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating recurring expense:', error)
      return NextResponse.json(
        { error: 'Error al actualizar gasto recurrente' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/gastos-recurrentes/[id]:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un gasto recurrente
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
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
