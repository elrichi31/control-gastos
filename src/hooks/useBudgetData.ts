import { useState, useEffect } from "react"
import {
  fetchBudgetsByYear,
  createBudget,
  deleteBudget,
  mapBudgetStatus,
  mapBudgetTrend,
  getBudgetStateString,
  type MonthlyDataGrid
} from "@/services/budget-general"
import { allMonths, type MonthData } from "@/lib/constants"

export function useBudgetData(selectedYear: string) {
  const [monthsByYear, setMonthsByYear] = useState<{ [year: string]: string[] }>({ "2025": [] })
  const [dataByYear, setDataByYear] = useState<{ [year: string]: MonthlyDataGrid }>({ "2025": {} })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string>("")

  // Fetch data cuando cambia el año
  useEffect(() => {
    async function fetchPresupuestos() {
      setIsLoading(true)
      try {
        // Usar el endpoint con conteo de gastos incluido
        const data = await fetchBudgetsByYear(selectedYear, true)
        
        if (data.length > 0 && data[0].anio.toString() === selectedYear) {
          const grid: MonthlyDataGrid = {}
          const months: string[] = []
          
          // Procesar cada presupuesto obtenido (ya incluye el conteo real de gastos)
          data.forEach((item) => {
            const monthObj = allMonths[item.mes - 1]
            if (!monthObj) return
            
            months.push(monthObj.value)
            grid[monthObj.value] = {
              total: item.total,
              expenses: item.gastos_registrados, // Ya viene con el conteo real
              status: mapBudgetStatus(item.estado, item.anio, item.mes),
              trend: mapBudgetTrend(item.tendencia),
              previousMonth: 0,
              id: item.id
            }
          })
          
          setMonthsByYear((prev) => ({ ...prev, [selectedYear]: months }))
          setDataByYear((prev) => ({ ...prev, [selectedYear]: grid }))
        } else {
          // Asegurar que siempre tengamos arrays vacíos inicializados
          setMonthsByYear((prev) => ({ ...prev, [selectedYear]: [] }))
          setDataByYear((prev) => ({ ...prev, [selectedYear]: {} }))
        }
      } catch (error) {
        console.error('Error fetching budgets:', error)
        // En caso de error, también inicializar con arrays vacíos
        setMonthsByYear((prev) => ({ ...prev, [selectedYear]: [] }))
        setDataByYear((prev) => ({ ...prev, [selectedYear]: {} }))
      } finally {
        setIsLoading(false)
      }
    }
    
    // Inicializar el año si no existe antes de hacer fetch
    setMonthsByYear(prev => {
      if (!prev[selectedYear]) {
        return { ...prev, [selectedYear]: [] }
      }
      return prev
    })
    setDataByYear(prev => {
      if (!prev[selectedYear]) {
        return { ...prev, [selectedYear]: {} }
      }
      return prev
    })
    
    fetchPresupuestos()
  }, [selectedYear])

  // Función para agregar un mes
  const addMonth = async (monthValue: string) => {
    setErrorMsg("")
    const monthObj = allMonths.find((m) => m.value === monthValue)
    if (!monthObj) return false

    try {
      const newBudget = await createBudget({
        anio: Number(selectedYear),
        mes: monthObj.number,
        total: 0,
        gastos_registrados: 0,
        tendencia: null,
        estado: getBudgetStateString(Number(selectedYear), monthObj.number)
      })
      
      // Usar el ID real devuelto por la API
      const realId = Array.isArray(newBudget) ? newBudget[0]?.id : newBudget?.id
      
      setMonthsByYear((prev) => ({
        ...prev,
        [selectedYear]: [...(prev[selectedYear] || []), monthValue]
      }))
      setDataByYear((prev) => ({
        ...prev,
        [selectedYear]: {
          ...(prev[selectedYear] || {}),
          [monthValue]: {
            total: 0,
            expenses: 0,
            status: mapBudgetStatus(getBudgetStateString(Number(selectedYear), monthObj.number), Number(selectedYear), monthObj.number),
            trend: "stable",
            previousMonth: 0,
            id: realId || 0
          }
        }
      }))
      
      return true
    } catch (error) {
      console.error('Error creating budget:', error)
      setErrorMsg("Error al crear el presupuesto")
      return false
    }
  }

  // Función para eliminar un mes
  const removeMonth = async (monthValue: string) => {
    const hasData = dataByYear[selectedYear]?.[monthValue]?.expenses > 0
    if (hasData) return false

    try {
      const monthNumber = allMonths.find(m => m.value === monthValue)?.number
      if (monthNumber) {
        await deleteBudget(selectedYear, monthNumber)
        
        // Actualizar estado local
        setMonthsByYear((prev) => ({
          ...prev,
          [selectedYear]: (prev[selectedYear] || []).filter((month) => month !== monthValue)
        }))
        setDataByYear((prev) => {
          const newData = { ...(prev[selectedYear] || {}) }
          delete newData[monthValue]
          return { ...prev, [selectedYear]: newData }
        })
        
        return true
      }
    } catch (error) {
      console.error('Error deleting budget:', error)
      setErrorMsg("Error al eliminar el presupuesto")
    }
    return false
  }

  // Función para inicializar nuevo año
  const initializeYear = (year: string) => {
    if (!monthsByYear[year]) {
      setMonthsByYear(prev => ({ ...prev, [year]: [] }))
      setDataByYear(prev => ({ ...prev, [year]: {} }))
    }
  }

  return {
    monthsByYear,
    dataByYear,
    isLoading,
    errorMsg,
    setErrorMsg,
    addMonth,
    removeMonth,
    initializeYear
  }
}