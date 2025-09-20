import { useMemo } from "react"
import { toDateWithTime } from "@/shared/lib/dateUtils"
import { MESES_NOMBRES, MESES_NOMBRES_LOWERCASE } from "@/shared/lib/constants"
import { startOfMonth, endOfMonth, subMonths } from "date-fns"

interface FilterOptions {
  filterType: "year-month" | "year" | "month" | "custom"
  year: string
  month: string
  dateFrom: string
  dateTo: string
}

interface DataProcessingHookProps {
  gastos: any[]
  currentFilters: FilterOptions
}

export function useDataProcessing({ gastos, currentFilters }: DataProcessingHookProps) {
  // Filtrar gastos según los filtros actuales
  const filteredGastos = useMemo(() => {
    return gastos.filter(gasto => {
      const fecha = toDateWithTime(gasto.fecha)
      
      switch (currentFilters.filterType) {
        case "year-month":
          const targetYear = parseInt(currentFilters.year)
          const targetMonth = MESES_NOMBRES_LOWERCASE.indexOf(currentFilters.month.toLowerCase() as any)
          return fecha.getFullYear() === targetYear && fecha.getMonth() === targetMonth
        
        case "year":
          return fecha.getFullYear() === parseInt(currentFilters.year)
        
        case "month":
          const monthIndex = ["enero", "febrero", "marzo", "abril", "mayo", "junio", 
                             "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
                             .indexOf(currentFilters.month.toLowerCase())
          return fecha.getMonth() === monthIndex
        
        case "custom":
          if (!currentFilters.dateFrom || !currentFilters.dateTo) return true
          const fromDate = new Date(currentFilters.dateFrom)
          const toDate = new Date(currentFilters.dateTo)
          return fecha >= fromDate && fecha <= toDate
        
        default:
          return true
      }
    })
  }, [gastos, currentFilters])

  // Datos agregados para gráficos de categorías
  const categoryData = useMemo(() => {
    const categoryTotals: Record<string, { total: number; nombre: string }> = {}
    
    filteredGastos.forEach(gasto => {
      const categoryName = gasto.categoria.nombre
      if (!categoryTotals[categoryName]) {
        categoryTotals[categoryName] = { total: 0, nombre: categoryName }
      }
      categoryTotals[categoryName].total += gasto.monto
    })

    const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#f59e0b", "#ec4899", "#6366f1", "#6b7280"]
    
    return Object.values(categoryTotals).map((category, index) => ({
      name: category.nombre,
      value: category.total,
      color: colors[index % colors.length]
    }))
  }, [filteredGastos])

  // Datos agregados para gráfico mensual (todo el año actual)
  const monthlyData = useMemo(() => {
    const currentYear = new Date().getFullYear()
    
    return MESES_NOMBRES.map((month, index) => {
      const monthGastos = gastos.filter(gasto => {
        const fecha = toDateWithTime(gasto.fecha)
        return fecha.getFullYear() === currentYear && fecha.getMonth() === index
      })
      
      const total = monthGastos.reduce((sum, gasto) => sum + gasto.monto, 0)
      
      return {
        month,
        amount: total
      }
    })
  }, [gastos])

  // Datos para radar chart
  const radarData = useMemo(() => {
    const maxValue = Math.max(...categoryData.map(c => c.value))
    const fullMark = maxValue > 0 ? Math.ceil(maxValue * 1.2) : 3000
    
    return categoryData.slice(0, 6).map(category => ({
      category: category.name,
      amount: category.value,
      fullMark
    }))
  }, [categoryData])

  // Cálculos para las métricas
  const totalExpenses = filteredGastos.reduce((sum, gasto) => sum + gasto.monto, 0)
  const monthlyAverage = monthlyData.length > 0 
    ? Math.round(monthlyData.reduce((sum, item) => sum + item.amount, 0) / monthlyData.length)
    : 0
  const totalTransactions = filteredGastos.length
  const averagePerCategory = categoryData.length > 0 
    ? Math.round(totalExpenses / categoryData.length)
    : 0

  // Comparaciones con mes anterior
  const currentMonthStats = useMemo(() => {
    // Si el filtro es por año-mes específico, usamos ese mes
    // Si no, usamos el mes actual
    let targetDate: Date
    
    if (currentFilters.filterType === "year-month") {
      const monthNames = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ]
      const monthIndex = monthNames.indexOf(currentFilters.month.toLowerCase())
      const year = parseInt(currentFilters.year)
      targetDate = new Date(year, monthIndex, 1)
    } else {
      targetDate = new Date()
    }

    const currentMonthStart = startOfMonth(targetDate)
    const currentMonthEnd = endOfMonth(targetDate)
    
    const previousMonthStart = startOfMonth(subMonths(targetDate, 1))
    const previousMonthEnd = endOfMonth(subMonths(targetDate, 1))

    const currentMonthGastos = gastos.filter(gasto => {
      const fecha = toDateWithTime(gasto.fecha)
      return fecha >= currentMonthStart && fecha <= currentMonthEnd
    })

    const previousMonthGastos = gastos.filter(gasto => {
      const fecha = toDateWithTime(gasto.fecha)
      return fecha >= previousMonthStart && fecha <= previousMonthEnd
    })

    const currentTotal = currentMonthGastos.reduce((sum, g) => sum + g.monto, 0)
    const previousTotal = previousMonthGastos.reduce((sum, g) => sum + g.monto, 0)
    const currentTransactions = currentMonthGastos.length
    const previousTransactions = previousMonthGastos.length

    // Calcular porcentajes de cambio
    const totalChange = previousTotal > 0 
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : currentTotal > 0 ? 100 : 0

    const transactionChange = previousTransactions > 0
      ? ((currentTransactions - previousTransactions) / previousTransactions) * 100
      : currentTransactions > 0 ? 100 : 0

    const avgPerTransactionCurrent = currentTransactions > 0 ? currentTotal / currentTransactions : 0
    const avgPerTransactionPrevious = previousTransactions > 0 ? previousTotal / previousTransactions : 0
    const avgPerTransactionChange = avgPerTransactionPrevious > 0
      ? ((avgPerTransactionCurrent - avgPerTransactionPrevious) / avgPerTransactionPrevious) * 100
      : avgPerTransactionCurrent > 0 ? 100 : 0

    return {
      current: {
        total: currentTotal,
        transactions: currentTransactions,
        avgPerTransaction: avgPerTransactionCurrent
      },
      previous: {
        total: previousTotal,
        transactions: previousTransactions,
        avgPerTransaction: avgPerTransactionPrevious
      },
      changes: {
        totalChange: Math.round(totalChange),
        transactionChange: Math.round(transactionChange),
        avgPerTransactionChange: Math.round(avgPerTransactionChange)
      }
    }
  }, [gastos, currentFilters])

  // Comparación por categorías (mes actual vs anterior)
  const categoryComparisonStats = useMemo(() => {
    // Si el filtro es por año-mes específico, usamos ese mes
    // Si no, usamos el mes actual
    let targetDate: Date
    
    if (currentFilters.filterType === "year-month") {
      const monthNames = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ]
      const monthIndex = monthNames.indexOf(currentFilters.month.toLowerCase())
      const year = parseInt(currentFilters.year)
      targetDate = new Date(year, monthIndex, 1)
    } else {
      targetDate = new Date()
    }

    const currentMonthStart = startOfMonth(targetDate)
    const currentMonthEnd = endOfMonth(targetDate)
    const previousMonthStart = startOfMonth(subMonths(targetDate, 1))
    const previousMonthEnd = endOfMonth(subMonths(targetDate, 1))

    const currentMonthGastos = gastos.filter(gasto => {
      const fecha = toDateWithTime(gasto.fecha)
      return fecha >= currentMonthStart && fecha <= currentMonthEnd
    })

    const previousMonthGastos = gastos.filter(gasto => {
      const fecha = toDateWithTime(gasto.fecha)
      return fecha >= previousMonthStart && fecha <= previousMonthEnd
    })

    // Agrupar por categoría
    const currentByCategory: Record<string, number> = {}
    const previousByCategory: Record<string, number> = {}

    currentMonthGastos.forEach(gasto => {
      const cat = gasto.categoria.nombre
      currentByCategory[cat] = (currentByCategory[cat] || 0) + gasto.monto
    })

    previousMonthGastos.forEach(gasto => {
      const cat = gasto.categoria.nombre
      previousByCategory[cat] = (previousByCategory[cat] || 0) + gasto.monto
    })

    // Calcular cambios por categoría
    const allCategories = new Set([...Object.keys(currentByCategory), ...Object.keys(previousByCategory)])
    const categoryChanges = Array.from(allCategories).map(categoria => {
      const current = currentByCategory[categoria] || 0
      const previous = previousByCategory[categoria] || 0
      const change = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0

      return {
        categoria,
        current,
        previous,
        change: Math.round(change),
        trend: change > 5 ? 'increase' as const : change < -5 ? 'decrease' as const : 'stable' as const
      }
    })

    return categoryChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  }, [gastos, currentFilters])

  // Análisis adicional para insights
  const monthlyDataWithValues = monthlyData.filter(m => m.amount > 0)
  const maxMonth = monthlyDataWithValues.reduce((max, month) => 
    month.amount > max.amount ? month : max, { month: "N/A", amount: 0 })
  const minMonth = monthlyDataWithValues.reduce((min, month) => 
    month.amount < min.amount ? month : min, { month: "N/A", amount: Infinity })
  
  const topCategory = categoryData.length > 0 
    ? categoryData.reduce((max, cat) => cat.value > max.value ? cat : max)
    : { name: "N/A", value: 0 }
  
  const categoryPercentage = totalExpenses > 0 
    ? ((topCategory.value / totalExpenses) * 100).toFixed(0)
    : "0"

  return {
    filteredGastos,
    categoryData,
    monthlyData,
    radarData,
    totalExpenses,
    monthlyAverage,
    totalTransactions,
    averagePerCategory,
    maxMonth,
    minMonth,
    topCategory,
    categoryPercentage,
    // Nuevas estadísticas de comparación
    currentMonthStats,
    categoryComparisonStats
  }
}
