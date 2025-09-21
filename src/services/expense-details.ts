// src/services/expense-details.ts
import { fetchExpenses, type Expense } from './expenses'
import { fetchCategories, type Category } from './categories'
import { fetchPaymentMethods, type PaymentMethod } from './paymentMethods'

export interface ExpenseDetailsData {
  gastos: Expense[]
  categories: Category[]
  paymentMethods: PaymentMethod[]
}

/**
 * Obtiene todos los datos necesarios para la página de detalle de gastos
 * Incluye gastos, categorías y métodos de pago
 */
export async function fetchExpenseDetailsData(): Promise<ExpenseDetailsData> {
  try {
    // Hacer las tres peticiones en paralelo para mejor performance
    const [gastos, categories, paymentMethods] = await Promise.all([
      fetchExpenses(),
      fetchCategories(),
      fetchPaymentMethods()
    ])

    return {
      gastos,
      categories,
      paymentMethods
    }
  } catch (error) {
    console.error('Error fetching expense details data:', error)
    throw new Error('Error al cargar los datos de gastos')
  }
}

/**
 * Elimina un gasto específico
 */
export async function deleteExpense(id: number): Promise<void> {
  try {
    const response = await fetch(`/api/gastos/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al eliminar el gasto')
    }
  } catch (error) {
    console.error('Error deleting expense:', error)
    throw error
  }
}