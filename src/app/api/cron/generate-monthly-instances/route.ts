import { NextResponse } from 'next/server'
import { createClient } from '@/lib/database/server'

/**
 * Cron mensual que se ejecuta el día 1 de cada mes a la 1am
 * Genera las instancias pendientes para todos los gastos recurrentes del próximo mes
 */
export async function GET(request: Request) {
  try {
    console.log('🔄 [CRON-MONTHLY] Iniciando generación de instancias mensuales:', new Date().toISOString())
    
    // Verificar que la petición viene de Vercel Cron o incluye el token secreto
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ [CRON-MONTHLY] Acceso no autorizado')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const hoy = new Date()
    
    // Calcular el mes siguiente
    const mesActual = hoy.getMonth() // 0-11
    const anioActual = hoy.getFullYear()
    const mesSiguiente = (mesActual + 1) % 12
    const anioSiguiente = mesSiguiente === 0 ? anioActual + 1 : anioActual

    // Obtener todos los gastos recurrentes activos
    const { data: gastosRecurrentes, error: fetchError } = await supabase
      .from('gasto_recurrente')
      .select('*')
      .eq('activo', true)

    if (fetchError) {
      console.error('Error fetching recurring expenses:', fetchError)
      return NextResponse.json(
        { error: 'Error al obtener gastos recurrentes' },
        { status: 500 }
      )
    }

    if (!gastosRecurrentes || gastosRecurrentes.length === 0) {
      console.log('ℹ️ [CRON-MONTHLY] No hay gastos recurrentes activos')
      return NextResponse.json({
        message: 'No hay gastos recurrentes activos',
        created: 0
      })
    }

    console.log(`📋 [CRON-MONTHLY] Encontrados ${gastosRecurrentes.length} gastos recurrentes activos`)
    console.log(`📅 [CRON-MONTHLY] Generando instancias para: ${anioSiguiente}-${String(mesSiguiente + 1).padStart(2, '0')}`)

    const resultados = {
      creadas: 0,
      errores: 0,
      omitidas: 0,
    }

    // Procesar cada gasto recurrente
    for (const gastoRecurrente of gastosRecurrentes) {
      try {
        let instanciasACrear: Array<{ fecha_programada: string }> = []

        if (gastoRecurrente.frecuencia === 'mensual') {
          // Para mensuales: crear una instancia para el día específico del mes siguiente
          const diaMes = gastoRecurrente.dia_mes
          const fechaProgramada = `${anioSiguiente}-${String(mesSiguiente + 1).padStart(2, '0')}-${String(diaMes).padStart(2, '0')}`

          // Verificar que no exceda la fecha_fin
          if (!gastoRecurrente.fecha_fin || fechaProgramada <= gastoRecurrente.fecha_fin) {
            instanciasACrear.push({ fecha_programada: fechaProgramada })
          }
        } else if (gastoRecurrente.frecuencia === 'semanal') {
          // Para semanales: crear instancias para todas las semanas del mes siguiente
          const diaSemana = gastoRecurrente.dia_semana // 1=Lunes, 7=Domingo
          
          // Primer día del mes siguiente
          const primerDiaMes = new Date(anioSiguiente, mesSiguiente, 1)
          const ultimoDiaMes = new Date(anioSiguiente, mesSiguiente + 1, 0)

          // Encontrar el primer día de la semana especificada en el mes
          let fecha = new Date(primerDiaMes)
          const diaSemanaActual = fecha.getDay() === 0 ? 7 : fecha.getDay()
          const diasHastaObjetivo = (diaSemana - diaSemanaActual + 7) % 7
          fecha.setDate(fecha.getDate() + diasHastaObjetivo)

          // Crear instancias para cada semana del mes
          while (fecha <= ultimoDiaMes) {
            const fechaProgramada = fecha.toISOString().split('T')[0]
            
            // Verificar que no exceda la fecha_fin
            if (!gastoRecurrente.fecha_fin || fechaProgramada <= gastoRecurrente.fecha_fin) {
              instanciasACrear.push({ fecha_programada: fechaProgramada })
            }
            
            // Avanzar a la siguiente semana
            fecha.setDate(fecha.getDate() + 7)
          }
        }

        // Crear todas las instancias para este gasto recurrente
        for (const instancia of instanciasACrear) {
          // Verificar si ya existe una instancia para esta fecha
          const { data: existente } = await supabase
            .from('gasto_recurrente_instancia')
            .select('id')
            .eq('gasto_recurrente_id', gastoRecurrente.id)
            .eq('fecha_programada', instancia.fecha_programada)
            .single()

          if (existente) {
            resultados.omitidas++
            continue
          }

          // Crear la instancia
          const { error: createError } = await supabase
            .from('gasto_recurrente_instancia')
            .insert({
              gasto_recurrente_id: gastoRecurrente.id,
              fecha_programada: instancia.fecha_programada,
              estado: 'pendiente',
            })

          if (createError) {
            console.error(`❌ [CRON-MONTHLY] Error creating instance for ${gastoRecurrente.id}:`, createError)
            resultados.errores++
          } else {
            console.log(`✅ [CRON-MONTHLY] Instancia creada para ${instancia.fecha_programada}`)
            resultados.creadas++
          }
        }
      } catch (error) {
        console.error(`Error processing recurring expense ${gastoRecurrente.id}:`, error)
        resultados.errores++
      }
    }

    console.log('✨ [CRON-MONTHLY] Generación completada:', resultados)
    return NextResponse.json({
      message: 'Generación de instancias completada',
      ...resultados,
      mes: `${anioSiguiente}-${String(mesSiguiente + 1).padStart(2, '0')}`,
    })
  } catch (error) {
    console.error('💥 [CRON-MONTHLY] Error in generate-monthly-instances cron:', error)
    return NextResponse.json(
      { error: 'Error al generar instancias mensuales' },
      { status: 500 }
    )
  }
}
