import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/shared/lib/auth-supabase'

// GET: Obtener todos los presupuestos mensuales, con filtro opcional por año
export async function GET(req: NextRequest) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const anioParam = searchParams.get('anio')

  let query = supabase
    .from('presupuesto_mensual')
    .select('*')
    .eq('user_id', userId)
    .order('anio', { ascending: false })
    .order('mes', { ascending: false })

  if (anioParam) {
    const anio = parseInt(anioParam)
    if (!isNaN(anio)) {
      query = query.eq('anio', anio)
    }
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  return NextResponse.json(data)
}

// POST: Crear un nuevo presupuesto mensual
export async function POST(req: NextRequest) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  const body = await req.json()
  const { anio, mes, total, gastos_registrados, tendencia, estado } = body

  // Validación: solo meses/años actuales o futuros
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  if (anio < currentYear || (anio === currentYear && mes < currentMonth)) {
    return NextResponse.json({ error: "Solo puedes crear presupuestos de meses actuales o futuros." }, { status: 400 })
  }

  // Verificar si ya existe un presupuesto para este usuario, año y mes
  const { data: existingPresupuesto, error: checkError } = await supabase
    .from('presupuesto_mensual')
    .select('id')
    .eq('user_id', userId)
    .eq('anio', anio)
    .eq('mes', mes)
    .limit(1)

  if (checkError) return NextResponse.json({ error: checkError.message }, { status: 500 })
  
  if (existingPresupuesto && existingPresupuesto.length > 0) {
    return NextResponse.json({ error: "Ya tienes un presupuesto creado para este mes y año." }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('presupuesto_mensual')
    .insert([{ anio, mes, total, gastos_registrados, tendencia, estado, user_id: userId }])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PUT: Actualizar un presupuesto mensual con total presupuestado
export async function PUT(req: NextRequest) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  const body = await req.json()
  const { presupuesto_mensual_id, total, gastos_registrados } = body

  if (!presupuesto_mensual_id || total === undefined || gastos_registrados === undefined) {
    return NextResponse.json({ error: 'Faltan parámetros requeridos: presupuesto_mensual_id, total y gastos_registrados' }, { status: 400 })
  }

  // 1. Verificar que el presupuesto pertenece al usuario
  const { data: presupuestoExistente, error: errorPresupuesto } = await supabase
    .from('presupuesto_mensual')
    .select('id, anio, mes')
    .eq('id', presupuesto_mensual_id)
    .eq('user_id', userId)
    .single()

  if (errorPresupuesto || !presupuestoExistente) {
    return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
  }

  // 2. Actualizar el total del presupuesto y gastos registrados
  const { data: presupuestoActualizado, error: errorUpdate } = await supabase
    .from('presupuesto_mensual')
    .update({
      total: total,
      gastos_registrados: gastos_registrados
    })
    .eq('id', presupuesto_mensual_id)
    .eq('user_id', userId)
    .select()
    .single()

  if (errorUpdate) {
    return NextResponse.json({ error: 'Error al actualizar presupuesto: ' + errorUpdate.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: presupuestoActualizado
  })
}

// DELETE: Eliminar un presupuesto mensual por año y mes
export async function DELETE(req: NextRequest) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const anioParam = searchParams.get('anio')
  const mesParam = searchParams.get('mes')

  if (!anioParam || !mesParam) {
    return NextResponse.json({ error: "Faltan parámetros anio y mes" }, { status: 400 })
  }

  const anio = parseInt(anioParam)
  const mes = parseInt(mesParam)
  if (isNaN(anio) || isNaN(mes)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
  }

  const { error } = await supabase
    .from('presupuesto_mensual')
    .delete()
    .eq('anio', anio)
    .eq('mes', mes)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
