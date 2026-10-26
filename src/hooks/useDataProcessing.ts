import { useMemo } from "react"
import { toDateWithTime } from "@/lib/utils"
import { MESES_NOMBRES_LOWERCASE } from "@/lib/constants"

interface FilterOptions {
  filterType: "year-month" | "year" | "month" | "custom" | "all"
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
          const fromDate = toDateWithTime(currentFilters.dateFrom)
          const toDate = toDateWithTime(currentFilters.dateTo, "end")
          return fecha >= fromDate && fecha <= toDate
        
        case "all":
          return true

        default:
          return true
      }
    })
  }, [gastos, currentFilters])

  return { filteredGastos }
}
