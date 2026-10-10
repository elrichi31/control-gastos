// src/services/stats.ts
import type { ExpenseForecast } from '@/lib/expense-forecast'

export async function fetchExpenseForecast(today: string, signal: AbortSignal): Promise<ExpenseForecast> {
  const response = await fetch(`/api/estadisticas/proyeccion?today=${today}`, { cache: 'no-store', signal })
  if (!response.ok) throw new Error(response.status === 401 ? 'Tu sesión expiró. Vuelve a iniciar sesión.' : 'No se pudo cargar el historial completo. Reintenta.')
  const data = await response.json()
  const totals = ['recorded', 'recordedToDate', 'futureRecorded', 'committed', 'floor']
  if (data?.today !== today || !totals.every(k => typeof data[k] === 'number' && Number.isFinite(data[k])) ||
    !['validated', 'initial', 'insufficient'].includes(data.status) ||
    !(data.projected === null || (typeof data.projected === 'number' && Number.isFinite(data.projected))) ||
    !['points', 'upcoming', 'models', 'warnings', 'backtest'].every(k => Array.isArray(data[k]))) {
    throw new Error('La respuesta está incompleta. Actualiza la proyección.')
  }
  return data
}
