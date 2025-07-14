import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabaseClient'

// GET: Obtener todos los presupuestos mensuales, con filtro opcional por año
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const anioParam = searchParams.get('anio')

  let query = supabase
    .from('presupuesto_mensual')
    .select('*')
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
  const body = await req.json()
  const { anio, mes, total, gastos_registrados, tendencia, estado } = body

  // Validación: solo meses/años actuales o futuros
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  if (anio < currentYear || (anio === currentYear && mes < currentMonth)) {
    return NextResponse.json({ error: "Solo puedes crear presupuestos de meses actuales o futuros." }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('presupuesto_mensual')
    .insert([{ anio, mes, total, gastos_registrados, tendencia, estado }])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: Eliminar un presupuesto mensual por año y mes
export async function DELETE(req: NextRequest) {
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
