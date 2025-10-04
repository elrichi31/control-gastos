import { NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/lib/auth/auth-supabase'

// GET - Obtener todos los gastos recurrentes del usuario
export async function GET() {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  const { data, error } = await supabase
    .from('gasto_recurrente')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching recurring expenses:', error)
    return NextResponse.json({ error: 'Error al obtener gastos recurrentes' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST - Crear un nuevo gasto recurrente
export async function POST(request: Request) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      descripcion,
      monto,
      categoria_id,
      metodo_pago_id,
      frecuencia,
      dia_semana,
      dia_mes,
      fecha_inicio,
      fecha_fin,
      activo = true
    } = body

    // Validaciones básicas
    if (!descripcion || !monto || !categoria_id || !metodo_pago_id || !frecuencia || !fecha_inicio) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    if (frecuencia === 'semanal' && !dia_semana) {
      return NextResponse.json(
        { error: 'Para frecuencia semanal es necesario especificar el día de la semana' },
        { status: 400 }
      )
    }

    if (frecuencia === 'mensual' && !dia_mes) {
      return NextResponse.json(
        { error: 'Para frecuencia mensual es necesario especificar el día del mes' },
        { status: 400 }
      )
    }

    if (frecuencia === 'mensual' && (dia_mes < 1 || dia_mes > 28)) {
      return NextResponse.json(
        { error: 'El día del mes debe estar entre 1 y 28 para garantizar compatibilidad con todos los meses' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('gasto_recurrente')
      .insert({
        user_id: userId,
        descripcion,
        monto,
        categoria_id,
        metodo_pago_id,
        frecuencia,
        dia_semana: frecuencia === 'semanal' ? dia_semana : null,
        dia_mes: frecuencia === 'mensual' ? dia_mes : null,
        fecha_inicio,
        fecha_fin: fecha_fin || null,
        activo
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating recurring expense:', error)
      return NextResponse.json({ error: 'Error al crear gasto recurrente' }, { status: 500 })
    }

    // Generar la primera instancia automáticamente
    const hoy = new Date()
    const diaActual = hoy.getDate()
    let fechaProgramada = ''
    let debeGenerarGasto = false

    if (frecuencia === 'mensual') {
      // Si el día del mes ya pasó este mes, generar el gasto
      if (dia_mes <= diaActual) {
        // Ya pasó este mes, generar para este mes
        const year = hoy.getFullYear()
        const month = String(hoy.getMonth() + 1).padStart(2, '0')
        const day = String(dia_mes).padStart(2, '0')
        fechaProgramada = `${year}-${month}-${day}`
        debeGenerarGasto = true
      } else {
        // Aún no llega este mes, programar para este mes
        const year = hoy.getFullYear()
        const month = String(hoy.getMonth() + 1).padStart(2, '0')
        const day = String(dia_mes).padStart(2, '0')
        fechaProgramada = `${year}-${month}-${day}`
        debeGenerarGasto = false
      }
    } else if (frecuencia === 'semanal') {
      // Para semanal, calcular el próximo día de la semana
      const diaSemanaActual = hoy.getDay() === 0 ? 7 : hoy.getDay() // Convertir domingo de 0 a 7
      const diasHastaProximo = (dia_semana - diaSemanaActual + 7) % 7
      
      if (diasHastaProximo === 0) {
        // Es hoy, generar el gasto
        fechaProgramada = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0]
        debeGenerarGasto = true
      } else if (diasHastaProximo < 0 || dia_semana < diaSemanaActual) {
        // Ya pasó esta semana
        fechaProgramada = new Date(hoy.getTime() - Math.abs(diasHastaProximo) * 24 * 60 * 60 * 1000 - hoy.getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0]
        debeGenerarGasto = true
      } else {
        // Aún no llega esta semana
        fechaProgramada = new Date(hoy.getTime() + diasHastaProximo * 24 * 60 * 60 * 1000 - hoy.getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0]
        debeGenerarGasto = false
      }
    }

    // Crear la instancia
    if (debeGenerarGasto) {
      // Crear el gasto real
      const { data: gastoData, error: gastoError } = await supabase
        .from('gasto')
        .insert({
          user_id: userId,
          descripcion,
          monto,
          categoria_id,
          metodo_pago_id,
          fecha: fechaProgramada,
          is_recurrent: true  // ✅ Marcar como recurrente
        })
        .select()
        .single()

      if (gastoError) {
        console.error('Error creating expense from recurring:', gastoError)
      } else {
        // Crear la instancia con estado 'generado'
        await supabase
          .from('gasto_recurrente_instancia')
          .insert({
            gasto_recurrente_id: data.id,
            gasto_id: gastoData.id,
            fecha_programada: fechaProgramada,
            estado: 'generado',
            generado_en: new Date().toISOString()
          })
      }
    } else {
      // Crear la instancia con estado 'pendiente'
      await supabase
        .from('gasto_recurrente_instancia')
        .insert({
          gasto_recurrente_id: data.id,
          fecha_programada: fechaProgramada,
          estado: 'pendiente'
        })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error parsing request:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 400 })
  }
}
