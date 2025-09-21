// src/hooks/useExpenseStatistics.ts
import { useMemo } from 'react'
import type { Expense } from '@/services/expenses'

export interface ExpenseStatistics {
  total: number
  count: number
  average: number
  categoryStats: Array<{
    categoria: string
    total: number
    count: number
    percentage: number
  }>
}

export function useExpenseStatistics(filteredGastos: Expense[]): ExpenseStatistics {
  return useMemo(() => {
    const total = filteredGastos.reduce((sum, gasto) => sum + gasto.monto, 0)
    const count = filteredGastos.length
    const average = count > 0 ? total / count : 0

    // Calcular estadísticas por categoría
    const categoryTotals = new Map<string, { total: number; count: number }>()
    
    filteredGastos.forEach(gasto => {
      const categoryName = gasto.categoria.nombre
      const current = categoryTotals.get(categoryName) || { total: 0, count: 0 }
      categoryTotals.set(categoryName, {
        total: current.total + gasto.monto,
        count: current.count + 1
      })
    })

    const categoryStats = Array.from(categoryTotals.entries()).map(([categoria, stats]) => ({
      categoria,
      total: stats.total,
      count: stats.count,
      percentage: total > 0 ? (stats.total / total) * 100 : 0
    })).sort((a, b) => b.total - a.total) // Ordenar por total descendente

    return {
      total,
      count,
      average,
      categoryStats
    }
  }, [filteredGastos])
}