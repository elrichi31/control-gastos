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

/**
 * Crea una nueva categoría
 */
export async function createCategory(nombre: string): Promise<Category> {
  try {
    const response = await fetch('/api/categorias', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombre }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al crear categoría')
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating category:', error)
    throw error
  }
}

/**
 * Actualiza una categoría existente
 */
export async function updateCategory(id: number, nombre: string): Promise<Category> {
  try {
    const response = await fetch(`/api/categorias?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombre }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al actualizar categoría')
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating category:', error)
    throw error
  }
}

/**
 * Elimina una categoría
 */
export async function deleteCategory(id: number): Promise<void> {
  try {
    const response = await fetch(`/api/categorias?id=${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al eliminar categoría')
    }
  } catch (error) {
    console.error('Error deleting category:', error)
    throw error
  }
}
