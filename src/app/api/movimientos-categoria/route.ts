import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/shared/lib/auth-supabase'

// GET: Obtener los movimientos (gastos) de todas las categorías de un presupuesto mensual
// /api/movimientos-categoria?presupuesto_mensual_id=123
export async function GET(req: NextRequest) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const presupuestoMensualId = searchParams.get('presupuesto_mensual_id')

  if (!presupuestoMensualId) {
    return NextResponse.json({ error: 'Falta el parámetro presupuesto_mensual_id' }, { status: 400 })
  }

  // Primero obtenemos todas las categorias de ese presupuesto mensual
  const { data: categorias, error: errorCategorias } = await supabase
    .from('presupuesto_categoria')
    .select('id, categoria_id, categoria(nombre)')
    .eq('presupuesto_mensual_id', presupuestoMensualId)

  if (errorCategorias) return NextResponse.json({ error: errorCategorias.message }, { status: 500 })

  // Para cada categoria, obtenemos los movimientos
  const movimientosPorCategoria = []
  for (const cat of categorias || []) {
    const { data: movimientos, error: errorMov } = await supabase
      .from('movimiento_presupuesto')
      .select('id, descripcion, monto, fecha, metodo_pago_id')
      .eq('presupuesto_categoria_id', cat.id)
      .order('fecha', { ascending: false })
    if (errorMov) return NextResponse.json({ error: errorMov.message }, { status: 500 })
    movimientosPorCategoria.push({
      categoria_id: cat.categoria_id,
      categoria_nombre: (cat.categoria && Array.isArray(cat.categoria) && cat.categoria.length > 0) ? (cat.categoria[0] as any).nombre : undefined,
      movimientos
    })
  }

  return NextResponse.json(movimientosPorCategoria)
}

export async function POST(req: NextRequest) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  const body = await req.json()
  const { presupuesto_categoria_id, descripcion, monto, fecha, metodo_pago_id } = body

  if (!presupuesto_categoria_id || !descripcion || !monto || !fecha) {
    return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })
  }

  // Crear el movimiento
  const { data, error } = await supabase
    .from('movimiento_presupuesto')
    .insert({ presupuesto_categoria_id, descripcion, monto, fecha, metodo_pago_id, user_id: userId })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Actualizar el total y cantidad de gastos en la categoría (opcional, si tienes un trigger o función RPC)
  // await supabase.rpc('actualizar_totales_categoria', { categoria_id: presupuesto_categoria_id })

  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  const body = await req.json()
  const { id, descripcion, monto, fecha, metodo_pago_id } = body

  if (!id || !descripcion || !monto || !fecha) {
    return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('movimiento_presupuesto')
    .update({ descripcion, monto, fecha, metodo_pago_id })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  const body = await req.json()
  const { id } = body

  if (!id) {
    return NextResponse.json({ error: 'Falta el parámetro id' }, { status: 400 })
  }

  const { error } = await supabase
    .from('movimiento_presupuesto')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
