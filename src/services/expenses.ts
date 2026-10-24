// src/services/expenses.ts
import { API_ENDPOINTS } from "@/lib/constants"
import type { StoredForeignTax } from "@/lib/foreign-tax"

export interface CreateExpenseData {
  descripcion: string
  monto: number
  categoria_id: number
  fecha: string
  metodo_pago_id: number
  is_recurrent?: boolean
  tags?: string[]
  impuesto_exterior?: StoredForeignTax | null
}

import type { Expense } from '@/types'
export type { Expense }

/**
 * Obtiene todos los gastos
 */
export interface ExpensePage { items: Expense[]; total: number; page: number; limit: number }
export async function fetchExpensesPage(options: { page?: number; limit?: number; from?: string; to?: string } = {}, signal?: AbortSignal): Promise<ExpensePage> {
  const params = new URLSearchParams({ page: String(options.page ?? 1), limit: String(options.limit ?? 500) })
  if (options.from) params.set('from', options.from)
  if (options.to) params.set('to', options.to)
  const response = await fetch(API_ENDPOINTS.GASTOS + '?' + params, { signal, cache: 'no-store' })
  if (!response.ok) throw new Error('Error al obtener gastos')
  const body: ExpensePage = await response.json()
  if (!Array.isArray(body.items) || !Number.isSafeInteger(body.total) || body.total < 0 || !Number.isSafeInteger(body.limit) || body.limit < 1) throw new Error('Respuesta de gastos inválida')
  return body
}

export async function fetchExpenses(signal?: AbortSignal, range: { from?: string; to?: string } = {}): Promise<Expense[]> {
  const expenses: Expense[] = []
  let page = 1
  let expectedTotal: number | undefined
  const seen = new Set<number>()
  while (true) {
    const result = await fetchExpensesPage({ ...range, page, limit: 500 }, signal)
    if (expectedTotal !== undefined && expectedTotal !== result.total) throw new Error('El historial cambió durante la carga. Reintenta.')
    expectedTotal = result.total
    for (const expense of result.items) {
      if (seen.has(expense.id)) throw new Error('El historial cambió durante la carga. Reintenta.')
      seen.add(expense.id)
    }
    expenses.push(...result.items)
    if (expenses.length >= result.total) return expenses
    if (result.items.length === 0) throw new Error('El historial cambió durante la carga. Reintenta.')
    page++
  }
}

/**
 * Crea un nuevo gasto
 */
export async function createExpense(expenseData: CreateExpenseData): Promise<Expense> {
  try {
    // Asegurar que is_recurrent siempre tenga un valor explícito
    const dataToSend = {
      ...expenseData,
      is_recurrent: expenseData.is_recurrent ?? false
    }
    
    const response = await fetch('/api/gastos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al crear gasto')
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating expense:', error)
    throw error
  }
}

/**
 * Elimina un gasto por ID
 */
export async function deleteExpense(id: string | number): Promise<void> {
  try {
    const response = await fetch(`/api/gastos?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al eliminar gasto')
    }
  } catch (error) {
    console.error('Error deleting expense:', error)
    throw error
  }
}

/**
 * Actualiza un gasto existente
 */
export async function updateExpense(id: string | number, expenseData: Partial<CreateExpenseData>): Promise<Expense> {
  try {
    const response = await fetch(`/api/gastos?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al actualizar gasto')
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating expense:', error)
    throw error
  }
}

/**
 * Obtiene el ID del gasto recurrente asociado a un gasto
 */
export async function getRecurringExpenseId(gastoId: string | number): Promise<number | null> {
  try {
    const response = await fetch(`/api/gastos/${gastoId}/recurring-info`)
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    return data.gasto_recurrente_id || null
  } catch (error) {
    console.error('Error getting recurring expense ID:', error)
    return null
  }
}

/**
 * Desactiva un gasto recurrente
 */
export async function deactivateRecurringExpense(recurringExpenseId: number): Promise<void> {
  try {
    const response = await fetch(`/api/gastos-recurrentes/${recurringExpenseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ activo: false }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al desactivar gasto recurrente')
    }
  } catch (error) {
    console.error('Error deactivating recurring expense:', error)
    throw error
  }
}
