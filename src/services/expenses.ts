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

const PAGE_LIMIT = 500
const PARALLEL_PAGES = 4

/** Todo el historial. La primera página da el total; el resto se pide en paralelo (de a 4)
 *  en vez de una tras otra. Si el historial cambia durante la carga, falla en vez de mezclar. */
export async function fetchExpenses(signal?: AbortSignal, range: { from?: string; to?: string } = {}): Promise<Expense[]> {
  const changed = () => new Error('El historial cambió durante la carga. Reintenta.')
  const first = await fetchExpensesPage({ ...range, page: 1, limit: PAGE_LIMIT }, signal)
  const total = first.total
  const pages: Expense[][] = [first.items]
  const pageCount = Math.ceil(total / PAGE_LIMIT)
  if (pageCount > 1 && first.items.length < PAGE_LIMIT) throw changed()
  for (let start = 2; start <= pageCount; start += PARALLEL_PAGES) {
    const batch = Array.from({ length: Math.min(PARALLEL_PAGES, pageCount - start + 1) }, (_, i) => start + i)
    const results = await Promise.all(batch.map(page => fetchExpensesPage({ ...range, page, limit: PAGE_LIMIT }, signal)))
    for (const result of results) {
      if (result.total !== total) throw changed()
      pages.push(result.items)
    }
  }
  const expenses = pages.flat()
  const seen = new Set<number>()
  for (const expense of expenses) {
    if (seen.has(expense.id)) throw changed()
    seen.add(expense.id)
  }
  if (expenses.length !== total) throw changed()
  return expenses
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
