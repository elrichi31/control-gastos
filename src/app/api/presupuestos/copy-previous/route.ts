import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/shared/lib/auth-supabase'

// POST: Copiar categorías del mes anterior al presupuesto actual
export async function POST(req: NextRequest) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient()
  if (authError) return authError

  const body = await req.json()
  const { presupuesto_mensual_id } = body

  if (!presupuesto_mensual_id) {
    return NextResponse.json({ error: 'Falta el parámetro presupuesto_mensual_id' }, { status: 400 })
  }

  try {
    // 1. Obtener información del presupuesto actual
    const { data: presupuestoActual, error: errorActual } = await supabase
      .from('presupuesto_mensual')
      .select('anio, mes')
      .eq('id', presupuesto_mensual_id)
      .eq('user_id', userId)
      .single()

    if (errorActual || !presupuestoActual) {
      return NextResponse.json({ error: 'Presupuesto actual no encontrado' }, { status: 404 })
    }

    // 2. Calcular mes anterior
    let mesAnterior = presupuestoActual.mes - 1
    let anioAnterior = presupuestoActual.anio

    if (mesAnterior === 0) {
      mesAnterior = 12
      anioAnterior = anioAnterior - 1
    }

    // 3. Buscar el presupuesto del mes anterior
    const { data: presupuestoAnterior, error: errorAnterior } = await supabase
      .from('presupuesto_mensual')
      .select('id')
      .eq('anio', anioAnterior)
      .eq('mes', mesAnterior)
      .eq('user_id', userId)
      .single()

    if (errorAnterior || !presupuestoAnterior) {
      return NextResponse.json({ error: 'No se encontró un presupuesto del mes anterior para copiar' }, { status: 404 })
    }

    // 4. Verificar si el presupuesto actual ya tiene categorías
    const { data: categoriasExistentes, error: errorExistentes } = await supabase
      .from('presupuesto_categoria')
      .select('id')
      .eq('presupuesto_mensual_id', presupuesto_mensual_id)
      .limit(1)

    if (errorExistentes) {
      return NextResponse.json({ error: errorExistentes.message }, { status: 500 })
    }

    if (categoriasExistentes && categoriasExistentes.length > 0) {
      return NextResponse.json({ error: 'El presupuesto actual ya tiene categorías configuradas' }, { status: 400 })
    }

    // 5. Obtener categorías del mes anterior con sus nombres
    const { data: categoriasAnteriores, error: errorCategorias } = await supabase
      .from('presupuesto_categoria')
      .select(`
        categoria_id, 
        id,
        categoria:categoria_id (
          nombre
        )
      `)
      .eq('presupuesto_mensual_id', presupuestoAnterior.id)

    if (errorCategorias) {
      return NextResponse.json({ error: errorCategorias.message }, { status: 500 })
    }

    if (!categoriasAnteriores || categoriasAnteriores.length === 0) {
      return NextResponse.json({ error: 'El mes anterior no tiene categorías para copiar' }, { status: 400 })
    }

    // 6. Obtener los movimientos de presupuesto para cada categoría del mes anterior
    const categoriasConMovimientos: { categoria_id: number; nombreCategoria: string; movimientos: any[] }[] = []
    for (const categoria of categoriasAnteriores) {
      const { data: movimientos, error: errorMovimientos } = await supabase
        .from('movimiento_presupuesto')
        .select('descripcion, monto, metodo_pago_id, fecha')
        .eq('presupuesto_categoria_id', categoria.id)

      if (errorMovimientos) {
        return NextResponse.json({ error: errorMovimientos.message }, { status: 500 })
      }

      // Solo incluir categorías que tengan movimientos de presupuesto
      if (movimientos && movimientos.length > 0) {
        categoriasConMovimientos.push({
          categoria_id: categoria.categoria_id,
          nombreCategoria: (categoria as any).categoria?.nombre || 'Categoría sin nombre',
          movimientos: movimientos
        })
      }
    }

    if (categoriasConMovimientos.length === 0) {
      return NextResponse.json({ error: 'El mes anterior no tiene presupuestos asignados para copiar' }, { status: 400 })
    }

    // 7. Crear categorías vacías en el presupuesto actual
    const categoriasParaCopiar = categoriasConMovimientos.map(cat => ({
      presupuesto_mensual_id: presupuesto_mensual_id,
      categoria_id: cat.categoria_id,
      total_categoria: 0, // Gastos reales empiezan en 0
      cantidad_gastos: 0, // Cantidad de gastos empieza en 0
      user_id: userId
    }))

    // 8. Insertar las categorías
    const { data: categoriasCopiadas, error: errorCopia } = await supabase
      .from('presupuesto_categoria')
      .insert(categoriasParaCopiar)
      .select('id, categoria_id')

    if (errorCopia) {
      return NextResponse.json({ error: errorCopia.message }, { status: 500 })
    }

    // 9. Crear los movimientos de presupuesto para cada categoría
    const movimientosParaCopiar: any[] = []
    
    categoriasCopiadas.forEach((categoriaCopiada, index) => {
      const categoriaConMovimientos = categoriasConMovimientos[index]
      
      // Crear un movimiento por cada movimiento original de la categoría
      categoriaConMovimientos.movimientos.forEach(movimientoOriginal => {
        // Tomar la fecha original y cambiar solo el mes y año según el presupuesto actual
        const fechaOriginal = movimientoOriginal.fecha // formato YYYY-MM-DD
        const [, , diaOriginal] = fechaOriginal.split('-')
        
        // Crear nueva fecha con el año y mes del presupuesto actual, manteniendo el día
        const mesFormateado = presupuestoActual.mes.toString().padStart(2, '0')
        const diaFormateado = diaOriginal.padStart(2, '0')
        const fechaFormateada = `${presupuestoActual.anio}-${mesFormateado}-${diaFormateado}`
        
        movimientosParaCopiar.push({
          presupuesto_categoria_id: categoriaCopiada.id,
          descripcion: movimientoOriginal.descripcion,
          monto: movimientoOriginal.monto,
          fecha: fechaFormateada,
          metodo_pago_id: movimientoOriginal.metodo_pago_id || 1,
          user_id: userId
        })
      })
    })

    // 10. Insertar los movimientos de presupuesto
    const { error: errorMovimientos } = await supabase
      .from('movimiento_presupuesto')
      .insert(movimientosParaCopiar)

    if (errorMovimientos) {
      // Si falla la inserción de movimientos, limpiar las categorías creadas
      await supabase
        .from('presupuesto_categoria')
        .delete()
        .in('id', categoriasCopiadas.map(c => c.id))
      
      return NextResponse.json({ error: errorMovimientos.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `Se copiaron ${categoriasCopiadas.length} categorías con sus presupuestos del mes anterior`,
      categorias: categoriasCopiadas.length,
      movimientos: movimientosParaCopiar.length
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}
