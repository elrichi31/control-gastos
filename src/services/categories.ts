// src/services/categories.ts

export interface Category {
  id: number
  nombre: string
}

/**
 * Obtiene todas las categorías disponibles
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await fetch('/api/categorias')
    if (!response.ok) {
      throw new Error('Error al obtener categorías')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw error
  }
}
