import { NextResponse } from 'next/server'
import { createClient } from '@/lib/database/server'

/**
 * Cron diario que se ejecuta a la 1am
 * Procesa todas las instancias pendientes cuya fecha programada es hoy o anterior
 * Cambia el estado de 'pendiente' a 'generado' y crea el gasto real
 */
export async function GET(request: Request) {
  try {
    // Verificar que la petición viene de Vercel Cron o incluye el token secreto
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const hoy = new Date().toISOString().split('T')[0]

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
      return NextResponse.json({
        message: 'No hay instancias pendientes para procesar',
        processed: 0
      })
    }

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
          console.error(`Error updating instance ${instancia.id}:`, updateError)
          resultados.errores++
        } else {
          resultados.procesados++
        }
      } catch (error) {
        console.error(`Error processing instance ${instancia.id}:`, error)
        resultados.errores++
      }
    }

    return NextResponse.json({
      message: 'Procesamiento completado',
      ...resultados,
      total: instanciasPendientes.length,
    })
  } catch (error) {
    console.error('Error in process-recurring-expenses cron:', error)
    return NextResponse.json(
      { error: 'Error al procesar gastos recurrentes' },
      { status: 500 }
    )
  }
}
