// Servicio para gestión de gastos recurrentes

import { CreateGastoRecurrenteInput, GastoRecurrente } from '@/types/recurring-expense'

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
