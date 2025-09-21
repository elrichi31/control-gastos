// Hook para lógica de cálculos del presupuesto
import { PresupuestoCategoriaDetalle, CategoriaDB } from "@/lib/budgetDetailsConstants"
import { calculateBudgetByCategory, calculateBudgetTotal, getAvailableCategories } from "@/services/budget-details"

interface GastosPorCategoria {
  [key: number]: {
    total: number
  }
}

export const useBudgetCalculations = (
  presupuestoCategorias: PresupuestoCategoriaDetalle[],
  categoriasDB: CategoriaDB[],
  gastosPorCategoria: GastosPorCategoria | null
) => {
  // Calcular presupuesto por categoría
  const getBudgetByCategory = (categoriaId: number): number => {
    return calculateBudgetByCategory(presupuestoCategorias, categoriaId)
  }

  // Calcular total presupuestado
  const getBudgetTotal = (): number => {
    return calculateBudgetTotal(presupuestoCategorias)
  }

  // Calcular total gastado usando los datos del hook
  const getSpentTotal = (): number => {
    if (!gastosPorCategoria) return 0
    return Object.values(gastosPorCategoria).reduce((sum, cat) => sum + (cat.total || 0), 0)
  }

  // Obtener total gastado por categoría
  const getCategoryTotal = (categoriaId: number): number => {
    return gastosPorCategoria?.[categoriaId]?.total || 0
  }

  // Obtener categorías disponibles para agregar
  const getAvailableCategoriesForAdd = (): CategoriaDB[] => {
    return getAvailableCategories(categoriasDB, presupuestoCategorias)
  }

  // Calcular progreso del presupuesto
  const getBudgetProgress = () => {
    const budgetTotal = getBudgetTotal()
    const spentTotal = getSpentTotal()
    
    if (budgetTotal === 0) return 0
    return (spentTotal / budgetTotal) * 100
  }

  // Calcular diferencia entre presupuesto y gasto
  const getBudgetDifference = () => {
    return getBudgetTotal() - getSpentTotal()
  }

  // Verificar si está sobre presupuesto
  const isOverBudget = () => {
    return getSpentTotal() > getBudgetTotal()
  }

  // Calcular progreso por categoría
  const getCategoryProgress = (categoriaId: number) => {
    const budget = getBudgetByCategory(categoriaId)
    const spent = getCategoryTotal(categoriaId)
    
    if (budget === 0) return 0
    return (spent / budget) * 100
  }

  // Verificar si una categoría está sobre presupuesto
  const isCategoryOverBudget = (categoriaId: number) => {
    return getCategoryTotal(categoriaId) > getBudgetByCategory(categoriaId)
  }

  // Obtener estado del presupuesto (texto)
  const getBudgetStatus = () => {
    const difference = getBudgetDifference()
    const total = getBudgetTotal()
    
    if (total === 0) return "Sin presupuesto"
    if (difference > 0) return "Bajo presupuesto"
    if (difference === 0) return "En presupuesto"
    return "Sobre presupuesto"
  }

  // Obtener color del estado del presupuesto
  const getBudgetStatusColor = () => {
    const difference = getBudgetDifference()
    const total = getBudgetTotal()
    
    if (total === 0) return "text-gray-500"
    if (difference > 0) return "text-green-600"
    if (difference === 0) return "text-blue-600"
    return "text-red-600"
  }

  return {
    // Cálculos básicos
    getBudgetByCategory,
    getBudgetTotal,
    getSpentTotal,
    getCategoryTotal,
    getAvailableCategoriesForAdd,

    // Análisis de presupuesto
    getBudgetProgress,
    getBudgetDifference,
    isOverBudget,
    getCategoryProgress,
    isCategoryOverBudget,

    // Estado y presentación
    getBudgetStatus,
    getBudgetStatusColor
  }
}