import type { SupabaseClient } from '@supabase/supabase-js'

// Shared by the web API and the MCP tools. `db` must be a service-role client:
// the SQL function and the price table are not granted to anon/authenticated.

export class RecurringActionError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}

const MISSING = ['PGRST202', 'PGRST205', '42883', '42P01']

export async function skipNextOccurrence(db: SupabaseClient, userId: string, id: number) {
  const { data, error } = await db.rpc('skip_recurring_occurrence', { p_id: id, p_user_id: userId })
  if (error) {
    if (MISSING.includes(error.code)) throw new RecurringActionError('Falta aplicar la migración de saltar cobros en Supabase', 503)
    if (error.code === '22023') throw new RecurringActionError('El gasto recurrente no tiene un próximo cobro que saltar', 400)
    throw new RecurringActionError('No se pudo saltar el cobro', 500)
  }
  if (!data) throw new RecurringActionError('Gasto recurrente no encontrado', 404)
  return data as { omitida: string; proxima_fecha: string | null }
}

export type PriceChange = { gasto_recurrente_id: number; monto_anterior: number; monto_nuevo: number; cambiado_en: string }

/** Latest changes first; empty when the history migration is not applied yet. */
export async function fetchPriceHistory(db: SupabaseClient, userId: string): Promise<PriceChange[]> {
  const { data, error } = await db.from('gasto_recurrente_precio')
    .select('gasto_recurrente_id,monto_anterior,monto_nuevo,cambiado_en')
    .eq('user_id', userId).order('cambiado_en', { ascending: false }).order('id', { ascending: false }).limit(500)
  if (error) {
    if (MISSING.includes(error.code)) return []
    throw new RecurringActionError('No se pudo consultar el historial de precios', 500)
  }
  return (data || []).map(r => ({ ...r, monto_anterior: Number(r.monto_anterior), monto_nuevo: Number(r.monto_nuevo) }))
}
