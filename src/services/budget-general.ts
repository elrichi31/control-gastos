// src/services/budget-general.ts

export interface BudgetMonth {
  id: number
  anio: number
  mes: number
  total: number
  gastos_registrados: number
  tendencia: string | null
  estado: string
}

export interface ExpenseStats {
  anio: number
  mes: number
  cantidad_gastos: number
  monto_total: number
}

export interface MonthlyDataGrid {
  [key: string]: {
    total: number
    expenses: number
    status: "completed" | "in-progress" | "pending"
    trend: "up" | "down" | "stable"
    previousMonth: number
    id: number
  }
}

/**
 * Obtiene todos los presupuestos de un año específico
 */
export async function fetchBudgetsByYear(year: string, includeExpenseCount: boolean = true): Promise<BudgetMonth[]> {
  try {
    const params = new URLSearchParams({ anio: year })
    if (includeExpenseCount) {
      params.append('include_expense_count', 'true')
    }
    
    const response = await fetch(`/api/presupuestos?${params.toString()}`)
    if (!response.ok) {
      throw new Error('Error al obtener presupuestos')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching budgets:', error)
    throw error
  }
}

/**
 * Obtiene las estadísticas reales de gastos para un mes específico
 */
export async function fetchExpenseStats(year: number, month: number): Promise<ExpenseStats> {
  try {
    const response = await fetch(`/api/gastos/stats?anio=${year}&mes=${month}`)
    if (!response.ok) {
      throw new Error('Error al obtener estadísticas de gastos')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching expense stats:', error)
    throw error
  }
}

/**
 * Crea un nuevo presupuesto mensual
 */
export async function createBudget(data: {
  anio: number
  mes: number
  total: number
  gastos_registrados: number
  tendencia: string | null
  estado: string
}): Promise<BudgetMonth> {
  try {
    const response = await fetch('/api/presupuestos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al crear presupuesto')
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating budget:', error)
    throw error
  }
}

/**
 * Elimina un presupuesto por año y mes
 */
export async function deleteBudget(year: string, month: number): Promise<void> {
  try {
    const response = await fetch(`/api/presupuestos?anio=${year}&mes=${month}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al eliminar presupuesto')
    }
  } catch (error) {
    console.error('Error deleting budget:', error)
    throw error
  }
}

/**
 * Mapea el estado del backend a los estados del frontend
 */
export function mapBudgetStatus(estado: string, year: number, month: number): "completed" | "in-progress" | "pending" {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Si es un mes anterior al actual, debe estar "completado"
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return "completed"
  }

  // Para el mes actual, "En progreso" = "in-progress"
  if (year === currentYear && month === currentMonth) {
    return "in-progress"
  }

  // Para meses futuros, aunque el estado sea "En progreso", mostrar como "pending"
  if (estado === "Completado" || estado === "completed" || estado.toLowerCase().includes("complet") || estado.toLowerCase().includes("finalizado")) return "completed"
  if (estado === "En progreso" && year === currentYear && month === currentMonth) return "in-progress"
  return "pending"
}

/**
 * Mapea la tendencia del backend a los tipos del frontend
 */
export function mapBudgetTrend(tendencia: string | null): "up" | "down" | "stable" {
  if (tendencia === "up" || tendencia === "UP") return "up"
  if (tendencia === "down" || tendencia === "DOWN") return "down"
  return "stable"
}

/**
 * Obtiene el estado correcto considerando si es un mes pasado
 */
export function getBudgetStateString(year: number, month: number): string {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Si es un mes anterior al actual, debe estar "Finalizado"
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return "Completado"
  }

  // Para el mes actual, "En progreso"
  if (year === currentYear && month === currentMonth) {
    return "En progreso"
  }

  // Para meses futuros, usar "En progreso" también (ya que "Pendiente" no funciona)
  return "En progreso"
}
