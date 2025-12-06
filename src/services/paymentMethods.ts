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

/**
 * Crea un nuevo método de pago
 */
export async function createPaymentMethod(nombre: string): Promise<PaymentMethod> {
  try {
    const response = await fetch('/api/metodos_pago', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombre }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al crear método de pago')
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating payment method:', error)
    throw error
  }
}

/**
 * Actualiza un método de pago existente
 */
export async function updatePaymentMethod(id: number, nombre: string): Promise<PaymentMethod> {
  try {
    const response = await fetch(`/api/metodos_pago?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombre }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al actualizar método de pago')
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating payment method:', error)
    throw error
  }
}

/**
 * Elimina un método de pago
 */
export async function deletePaymentMethod(id: number): Promise<void> {
  try {
    const response = await fetch(`/api/metodos_pago?id=${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al eliminar método de pago')
    }
  } catch (error) {
    console.error('Error deleting payment method:', error)
    throw error
  }
}
