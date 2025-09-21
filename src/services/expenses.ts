// src/services/expenses.ts
import { API_ENDPOINTS } from "@/lib/constants"

export interface CreateExpenseData {
  descripcion: string
  monto: number
  categoria_id: number
  fecha: string
  metodo_pago_id: number
}

export interface Expense {
  id: number
  descripcion: string
  monto: number
  fecha: string
  categoria_id: number
  categoria: { id: number; nombre: string }
  metodo_pago?: { id: number; nombre: string }
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
    const response = await fetch('/api/gastos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData),
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