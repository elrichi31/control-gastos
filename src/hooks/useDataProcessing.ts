import { useMemo } from "react"
import { toDateWithTime } from "@/lib/dateUtils"
import { MESES_NOMBRES, MESES_NOMBRES_LOWERCASE } from "@/lib/constants"

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
    categoryPercentage
  }
}
