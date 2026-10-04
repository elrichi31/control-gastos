import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/lib/auth'
import { requireOwnedBudget } from '@/lib/auth/budget-ownership'

// GET: Devuelve para un presupuesto mensual todas las categorías con su total, cantidad de gastos, nombre y movimientos
// /api/presupuesto-mensual-detalle?presupuesto_mensual_id=123
export async function GET(req: NextRequest) {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient(req)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const presupuestoMensualId = searchParams.get('presupuesto_mensual_id')

  if (!presupuestoMensualId) {
    return NextResponse.json({ error: 'Falta el parámetro presupuesto_mensual_id' }, { status: 400 })
  }

  const ownershipError = await requireOwnedBudget(supabase, userId, presupuestoMensualId)
  if (ownershipError) return ownershipError

  // Traer todas las categorías del presupuesto mensual con nombre
  const { data: categorias, error: errorCategorias } = await supabase
    .from('presupuesto_categoria')
    .select('id, categoria_id, total_categoria, cantidad_gastos, categoria(nombre)')
    .eq('presupuesto_mensual_id', presupuestoMensualId)
    .eq('user_id', userId)

  if (errorCategorias) return NextResponse.json({ error: 'No se pudo completar la operación' }, { status: 500 })

  // Para cada categoría, obtener los movimientos
  const resultado = []
  for (const cat of categorias || []) {
    const { data: movimientos, error: errorMov } = await supabase
      .from('movimiento_presupuesto')
      .select('id, descripcion, monto, fecha, metodo_pago_id, tags')
      .eq('presupuesto_categoria_id', cat.id)
      .eq('user_id', userId)
      .order('fecha', { ascending: false })
    if (errorMov) return NextResponse.json({ error: 'No se pudo completar la operación' }, { status: 500 })
    resultado.push({
      id: cat.id,
      categoria_id: cat.categoria_id,
      total_categoria: cat.total_categoria,
      cantidad_gastos: cat.cantidad_gastos,
      categoria: (cat.categoria && Array.isArray(cat.categoria) && cat.categoria.length > 0) ? cat.categoria[0] : cat.categoria,
      movimientos
    })
  }

  return NextResponse.json(resultado)
}
