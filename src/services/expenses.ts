// src/services/expenses.ts
import { API_ENDPOINTS } from "@/lib/constants"

export interface CreateExpenseData {
  descripcion: string
  monto: number
  categoria_id: number
  fecha: string
  metodo_pago_id: number
  is_recurrent?: boolean
}

export interface Expense {
  id: number
  descripcion: string
  monto: number
  fecha: string
  categoria_id: number
  categoria: { id: number; nombre: string }
  metodo_pago?: { id: number; nombre: string }
  is_recurrent?: boolean
}

/**
 * Obtiene todos los gastos
 */
export async function fetchExpenses(): Promise<Expense[]> {
  try {
    const response = await fetch(API_ENDPOINTS.GASTOS)
    if (!response.ok) {
      throw new Error('Error al obtener gastos')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching expenses:', error)
    throw error
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