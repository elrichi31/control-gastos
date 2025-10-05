import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Cron diario que se ejecuta a la 1am
 * Procesa todas las instancias pendientes cuya fecha programada es hoy o anterior
 * Cambia el estado de 'pendiente' a 'generado' y crea el gasto real
 */
export async function GET() {
  try {
    console.log('🔄 [CRON] Iniciando proceso de gastos recurrentes:', new Date().toISOString())
    
    // Crear cliente de Supabase sin autenticación de usuario
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )
    
    const hoy = new Date().toISOString().split('T')[0]
    console.log('📅 [CRON] Fecha actual:', hoy)

    // Obtener todas las instancias pendientes cuya fecha programada es hoy o anterior
    const { data: instanciasPendientes, error: fetchError } = await supabase
      .from('gasto_recurrente_instancia')
      .select(`
        *,
        gasto_recurrente:gasto_recurrente_id (*)
      `)
      .eq('estado', 'pendiente')
      .lte('fecha_programada', hoy)

    if (fetchError) {
      console.error('Error fetching pending instances:', fetchError)
      return NextResponse.json(
        { error: 'Error al obtener instancias pendientes' },
        { status: 500 }
      )
    }

    if (!instanciasPendientes || instanciasPendientes.length === 0) {
      console.log('ℹ️ [CRON] No hay instancias pendientes para procesar')
      return NextResponse.json({
        message: 'No hay instancias pendientes para procesar',
        processed: 0
      })
    }

    console.log(`📋 [CRON] Encontradas ${instanciasPendientes.length} instancias pendientes para procesar`)

    const resultados = {
      procesados: 0,
      errores: 0,
      omitidos: 0,
    }

    // Procesar cada instancia pendiente
    for (const instancia of instanciasPendientes) {
      const gastoRecurrente = instancia.gasto_recurrente

      // Verificar que el gasto recurrente esté activo
      if (!gastoRecurrente.activo) {
        console.log(`⏭️ [CRON] Omitiendo instancia ${instancia.id} - Gasto recurrente inactivo`)
        // Marcar como omitido
        await supabase
          .from('gasto_recurrente_instancia')
          .update({ estado: 'omitido' })
          .eq('id', instancia.id)
        
        resultados.omitidos++
        continue
      }

      // Verificar si ya pasó la fecha_fin
      if (gastoRecurrente.fecha_fin && instancia.fecha_programada > gastoRecurrente.fecha_fin) {
        await supabase
          .from('gasto_recurrente_instancia')
          .update({ estado: 'omitido' })
          .eq('id', instancia.id)
        
        resultados.omitidos++
        continue
      }

      try {
        // Crear el gasto real
        const { data: gastoCreado, error: gastoError } = await supabase
          .from('gasto')
          .insert({
            user_id: gastoRecurrente.user_id,
            descripcion: gastoRecurrente.descripcion,
            monto: gastoRecurrente.monto,
            fecha: instancia.fecha_programada,
            categoria_id: gastoRecurrente.categoria_id,
            metodo_pago_id: gastoRecurrente.metodo_pago_id,
            is_recurrent: true,
          })
          .select()
          .single()

        if (gastoError) {
          console.error(`Error creating expense for instance ${instancia.id}:`, gastoError)
          resultados.errores++
          continue
        }

        // Actualizar la instancia a 'generado'
        const { error: updateError } = await supabase
          .from('gasto_recurrente_instancia')
          .update({
            estado: 'generado',
            gasto_id: gastoCreado.id,
            generado_en: new Date().toISOString(),
          })
          .eq('id', instancia.id)

        if (updateError) {
          console.error(`❌ [CRON] Error updating instance ${instancia.id}:`, updateError)
          resultados.errores++
        } else {
          console.log(`✅ [CRON] Gasto generado exitosamente - Instancia ${instancia.id}, Gasto ${gastoCreado.id}`)
          resultados.procesados++
        }
      } catch (error) {
        console.error(`Error processing instance ${instancia.id}:`, error)
        resultados.errores++
      }
    }

    console.log('✨ [CRON] Procesamiento completado:', resultados)
    return NextResponse.json({
      message: 'Procesamiento completado',
      ...resultados,
      total: instanciasPendientes.length,
    })
  } catch (error) {
    console.error('💥 [CRON] Error in process-recurring-expenses cron:', error)
    return NextResponse.json(
      { error: 'Error al procesar gastos recurrentes' },
      { status: 500 }
    )
  }
}
