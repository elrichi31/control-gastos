import { NextResponse } from 'next/server'

export class RecurringValidationError extends Error {}
// Keep web/mobile response shapes unchanged; scheduling state belongs to SQL only.
export function publicRecurringRule(row: Record<string, unknown>) {
  const data = { ...row }
  delete data.proxima_fecha
  delete data.ultima_fecha_generada
  return data
}
export function validateRecurringRule(input: Record<string, unknown>) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new RecurringValidationError('Datos recurrentes inválidos')
  const description = typeof input.descripcion === 'string' ? input.descripcion.trim() : ''
  const numeric = (value: unknown) => typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN
  const amount = numeric(input.monto)
  const category = numeric(input.categoria_id)
  const payment = numeric(input.metodo_pago_id)
  if (!description || !Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(category) || category <= 0 || !Number.isSafeInteger(payment) || payment <= 0) {
    throw new RecurringValidationError('Descripción, monto, categoría o método de pago inválidos')
  }
  const frequency = input.frecuencia
  if (frequency !== 'semanal' && frequency !== 'mensual') throw new RecurringValidationError('Frecuencia inválida')
  const day = numeric(frequency === 'mensual' ? input.dia_mes : input.dia_semana)
  if (!Number.isInteger(day) || day < 1 || day > (frequency === 'mensual' ? 28 : 7)) throw new RecurringValidationError('Día del calendario inválido')
  const validDate = (value: unknown): value is string => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const date = new Date(value + 'T00:00:00Z')
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  }
  const start = input.fecha_inicio
  const end = input.fecha_fin === '' || input.fecha_fin == null ? null : input.fecha_fin
  if (!validDate(start) || (end !== null && (!validDate(end) || end < start))) throw new RecurringValidationError('Fechas de inicio o fin inválidas')
  const active = input.activo === undefined ? true : input.activo
  if (typeof active !== 'boolean') throw new RecurringValidationError('Estado activo inválido')
  return {
    descripcion: description, monto: amount, categoria_id: category, metodo_pago_id: payment,
    frecuencia: frequency, dia_mes: frequency === 'mensual' ? day : null, dia_semana: frequency === 'semanal' ? day : null,
    fecha_inicio: start, fecha_fin: end, activo: active,
  }
}

export function recurringDatabaseError(error: { code?: string }) {
  if (['PGRST202', 'PGRST204', '42703', '42883'].includes(error.code || '')) {
    return NextResponse.json({ error: 'Falta aplicar la migración de gastos recurrentes en Supabase' }, { status: 503 })
  }
  if (['22007', '22008', '22023', '22P02', '23502', '23503', '23514'].includes(error.code || '')) {
    return NextResponse.json({ error: 'Datos de gasto recurrente inválidos' }, { status: 400 })
  }
  console.error('[recurring] Database failure', { code: error.code })
  return NextResponse.json({ error: 'Error al guardar el gasto recurrente' }, { status: 500 })
}
export function recurringRequestError(error: unknown) {
  if (error instanceof RecurringValidationError || error instanceof SyntaxError) {
    return NextResponse.json({ error: error instanceof RecurringValidationError ? error.message : 'JSON inválido' }, { status: 400 })
  }
  console.error('[recurring] Unexpected request failure')
  return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
}
