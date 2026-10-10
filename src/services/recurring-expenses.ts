// Servicio para gestión de gastos recurrentes

import { CreateGastoRecurrenteInput, GastoRecurrente } from '@/types/recurring-expense'
import type { PlanningRule } from '@/lib/month-planning'
import type { PriceChange } from '@/lib/recurring-actions'

const API_BASE = '/api/gastos-recurrentes'

export async function createRecurringExpense(data: CreateGastoRecurrenteInput): Promise<GastoRecurrente> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al crear gasto recurrente')
  }

  return response.json()
}

export async function fetchRecurringExpenses(): Promise<GastoRecurrente[]> {
  const response = await fetch(API_BASE)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al obtener gastos recurrentes')
  }

  return response.json()
}

export async function deleteRecurringExpense(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al eliminar gasto recurrente')
  }
}

export async function updateRecurringExpense(id: number, data: Partial<CreateGastoRecurrenteInput>): Promise<GastoRecurrente> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al actualizar gasto recurrente')
  }

  return response.json()
}

export const MONTH_PLAN_ERROR = 'No se pudo cargar el plan del mes. Verifica el presupuesto y la migración de recurrentes e intenta de nuevo.'

export type RecurringPlan = { rules: PlanningRule[]; links: { id: number; gasto_recurrente_id: number }[] }

export async function fetchRecurringPrices(): Promise<PriceChange[]> {
  const response = await fetch(`${API_BASE}/precios`, { cache: 'no-store' })
  if (!response.ok) throw new Error('Error al obtener los cambios de precio')
  return response.json()
}

/** Plan del mes: el API público de recurrentes oculta el estado de agenda; este endpoint solo web lo expone. */
export async function fetchRecurringPlan(month: string, signal?: AbortSignal): Promise<RecurringPlan> {
  const response = await fetch(`/api/dashboard/recurring-plan?month=${month}`, { signal, cache: 'no-store' })
  if (!response.ok) throw new Error(MONTH_PLAN_ERROR)
  return response.json()
}

/** Omite el próximo cobro; devuelve la fecha omitida. */
export async function skipRecurringCharge(id: number): Promise<{ omitida: string }> {
  const response = await fetch(`${API_BASE}/${id}/saltar`, { method: 'POST' })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'No se pudo saltar el cobro')
  return body
}
