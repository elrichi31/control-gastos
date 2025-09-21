import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/lib/auth'

// GET: Obtener todos los presupuestos mensuales, con filtro opcional por año
export async function GET(req: NextRequest) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const anioParam = searchParams.get('anio')
  const includeExpenseCount = searchParams.get('include_expense_count') === 'true'

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
  
  // Si se solicita incluir el conteo de gastos reales, calcularlos para cada presupuesto
  if (includeExpenseCount && data) {
    const dataWithExpenseCounts = await Promise.all(
      data.map(async (presupuesto) => {
        try {
          // Construir las fechas de inicio y fin del mes
          const startDate = `${presupuesto.anio}-${presupuesto.mes.toString().padStart(2, '0')}-01`
          const nextMonth = presupuesto.mes === 12 ? 1 : presupuesto.mes + 1
          const nextYear = presupuesto.mes === 12 ? presupuesto.anio + 1 : presupuesto.anio
          const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`

          // Contar gastos del mes específico
          const { count, error: countError } = await supabase
            .from('gasto')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('fecha', startDate)
            .lt('fecha', endDate)

          if (countError) {
            console.error('Error al contar gastos para presupuesto:', countError)
            return { ...presupuesto, gastos_registrados: presupuesto.gastos_registrados }
          }

          return { ...presupuesto, gastos_registrados: count || 0 }
        } catch (error) {
          console.error('Error procesando presupuesto:', error)
          return presupuesto
        }
      })
    )
    
    return NextResponse.json(dataWithExpenseCounts)
  }
  
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

  if (error) {
    console.error('Supabase error details:', error)
    
    // Si es un error de constraint, usar "En progreso" que sabemos que funciona
    if (error.message.includes('presupuesto_mensual_estado_check')) {
      console.log(`Constraint error, using "En progreso" instead of "${estado}"`)
      
      const { data: retryData, error: retryError } = await supabase
        .from('presupuesto_mensual')
        .insert([{ anio, mes, total, gastos_registrados, tendencia, estado: "En progreso", user_id: userId }])
        .select()
      
      if (retryError) {
        return NextResponse.json({ 
          error: `Error de constraint: ${retryError.message}` 
        }, { status: 500 })
      }
      
      return NextResponse.json(retryData)
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
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
