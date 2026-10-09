// src/services/paymentMethods.ts

export interface PaymentMethod {
  id: number
  nombre: string
}

/**
 * Obtiene todos los métodos de pago disponibles
 */
export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const response = await fetch('/api/metodos_pago')
    if (!response.ok) {
      throw new Error('Error al obtener métodos de pago')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    throw error
  }
}
