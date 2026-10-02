import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function requireOwnedBudget(db: SupabaseClient, userId: string, id: string | number) {
  const { data, error } = await db.from('presupuesto_mensual')
    .select('id').eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) return NextResponse.json({ error: 'No se pudo verificar el presupuesto' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
  return null
}

export async function requireOwnedBudgetMovement(db: SupabaseClient, userId: string, id: string | number) {
  const { data, error } = await db.from('movimiento_presupuesto')
    .select('id, presupuesto_categoria_id').eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) return NextResponse.json({ error: 'No se pudo verificar el movimiento' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 })
  return requireOwnedBudgetCategory(db, userId, data.presupuesto_categoria_id)
}

export async function requireOwnedBudgetCategory(db: SupabaseClient, userId: string, id: string | number) {
  const { data, error } = await db.from('presupuesto_categoria')
    .select('id, presupuesto_mensual_id').eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) return NextResponse.json({ error: 'No se pudo verificar la categoría' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
  return requireOwnedBudget(db, userId, data.presupuesto_mensual_id)
}
