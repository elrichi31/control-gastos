"use client"

import { useMemo } from "react"
import { startOfMonth, endOfMonth, isToday, isYesterday, subMonths } from "date-fns"
import { toDateWithTime } from "@/lib/utils"
import { Expense } from "@/types"

const currentDate = new Date()
const currentMonth = startOfMonth(currentDate)
const currentMonthEnd = endOfMonth(currentDate)
const lastMonth = startOfMonth(subMonths(currentDate, 1))
const lastMonthEnd = endOfMonth(subMonths(currentDate, 1))

export function useDashboardData(gastos: Expense[]) {
  // Gastos del mes actual
  const currentMonthExpenses = useMemo(() => {
    return gastos.filter(g => {
      const fecha = toDateWithTime(g.fecha)
      return fecha >= currentMonth && fecha <= currentMonthEnd
    })
  }, [gastos])

  // Gastos del mes pasado
  const lastMonthExpenses = useMemo(() => {
    return gastos.filter(g => {
      const fecha = toDateWithTime(g.fecha)
      return fecha >= lastMonth && fecha <= lastMonthEnd
    })
  }, [gastos])

  // Gastos de hoy
  const todayExpenses = useMemo(() => {
    return gastos.filter(g => {
      const fecha = toDateWithTime(g.fecha)
      return isToday(fecha)
    })
  }, [gastos])

  // Gastos de ayer
  const yesterdayExpenses = useMemo(() => {
    return gastos.filter(g => {
      const fecha = toDateWithTime(g.fecha)
      return isYesterday(fecha)
    })
  }, [gastos])

  // Últimos 5 gastos
  const recentExpenses = useMemo(() => {
    return gastos
      .sort((a, b) => {
        const fechaA = toDateWithTime(a.fecha)
        const fechaB = toDateWithTime(b.fecha)
        return fechaB.getTime() - fechaA.getTime()
      })
      .slice(0, 5)
  }, [gastos])

  // Totales
  const currentMonthTotal = currentMonthExpenses.reduce((sum, g) => sum + g.monto, 0)
  const lastMonthTotal = lastMonthExpenses.reduce((sum, g) => sum + g.monto, 0)
  const todayTotal = todayExpenses.reduce((sum, g) => sum + g.monto, 0)
  const yesterdayTotal = yesterdayExpenses.reduce((sum, g) => sum + g.monto, 0)
  const monthlyChange = currentMonthTotal - lastMonthTotal
  const monthlyChangePercentage = lastMonthTotal > 0 ? ((monthlyChange / lastMonthTotal) * 100) : 0

  // Categoría con más gasto este mes
  const topCategory = useMemo(() => {
    const categoryTotals: Record<string, { name: string; total: number }> = {}
    currentMonthExpenses.forEach(g => {
      if (!categoryTotals[g.categoria_id]) {
        categoryTotals[g.categoria_id] = { name: g.categoria.nombre, total: 0 }
      }
      categoryTotals[g.categoria_id].total += g.monto
    })
    
    const topCat = Object.values(categoryTotals).sort((a, b) => b.total - a.total)[0]
    return topCat || { name: "N/A", total: 0 }
  }, [currentMonthExpenses])

  return {
    currentDate,
    currentMonthExpenses,
    lastMonthExpenses,
    todayExpenses,
    yesterdayExpenses,
    recentExpenses,
    currentMonthTotal,
    lastMonthTotal,
    todayTotal,
    yesterdayTotal,
    monthlyChange,
    monthlyChangePercentage,
    topCategory
  }
}
