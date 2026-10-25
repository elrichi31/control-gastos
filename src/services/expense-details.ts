// src/services/expense-details.ts
import { fetchCategories, type Category } from './categories'
import { fetchPaymentMethods, type PaymentMethod } from './paymentMethods'

export interface ExpenseDetailsCatalogs {
  categories: Category[]
  paymentMethods: PaymentMethod[]
}

/**
 * Obtiene categorías y métodos de pago de la página de detalle de gastos.
 * Los gastos salen del store compartido (useExpensesStore).
 */
export async function fetchExpenseDetailsData(): Promise<ExpenseDetailsCatalogs> {
  try {
    const [categories, paymentMethods] = await Promise.all([
      fetchCategories(),
      fetchPaymentMethods()
    ])

    return {
      categories,
      paymentMethods
    }
  } catch (error) {
    console.error('Error fetching expense details data:', error)
    throw new Error('Error al cargar los datos de gastos')
  }
}
