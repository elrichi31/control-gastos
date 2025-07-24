import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/lib/auth-supabase'

// DELETE: Borra una categoría de presupuesto solo si no tiene movimientos
// /api/presupuesto-categoria?id=123
export async function GET(req: NextRequest) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const presupuestoMensualId = searchParams.get('presupuesto_mensual_id')

  if (!presupuestoMensualId) {
    return NextResponse.json({ error: 'Falta el parámetro presupuesto_mensual_id' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('presupuesto_categoria')
    .select('id, categoria_id, total_categoria, cantidad_gastos, categoria(nombre)')
    .eq('presupuesto_mensual_id', presupuestoMensualId)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}


export async function DELETE(req: NextRequest) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Falta el parámetro id' }, { status: 400 })
  }

  // Verificar si existen movimientos asociados a la categoría
  const { data: movimientos, error: errorMov } = await supabase
    .from('movimiento_presupuesto')
    .select('id')
    .eq('presupuesto_categoria_id', id)
    .eq('user_id', userId)
    .limit(1)

  if (errorMov) {
    return NextResponse.json({ error: errorMov.message }, { status: 500 })
  }

  if (movimientos && movimientos.length > 0) {
    return NextResponse.json({ error: 'No se puede borrar la categoría porque tiene movimientos asociados.' }, { status: 400 })
  }

  // Borrar la categoría
  const { error: errorDelete } = await supabase
    .from('presupuesto_categoria')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (errorDelete) {
    return NextResponse.json({ error: errorDelete.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  const body = await req.json()
  const { presupuesto_mensual_id, categoria_id } = body

  if (!presupuesto_mensual_id || !categoria_id) {
    return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })
  }

  // Crear la categoría de presupuesto
  const { data, error } = await supabase
    .from('presupuesto_categoria')
    .insert({ presupuesto_mensual_id, categoria_id, total_categoria: 0, cantidad_gastos: 0, user_id: userId })
    .select('id, categoria_id, total_categoria, cantidad_gastos, categoria(nombre)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
