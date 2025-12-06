import { allMonths, type MonthData } from "@/lib/constants"

export function useBudgetValidation(selectedYear: string, monthsByYear: { [year: string]: string[] }) {
  // Validar si se puede agregar un mes
  const validateAddMonth = (monthValue: string): { isValid: boolean; errorMsg: string } => {
    const monthObj = allMonths.find((m) => m.value === monthValue)
    if (!monthObj) return { isValid: false, errorMsg: "Mes no válido" }
    
    // Validación frontend
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    if (Number(selectedYear) < currentYear || (Number(selectedYear) === currentYear && monthObj.number < currentMonth)) {
      return { isValid: false, errorMsg: "Solo puedes crear presupuestos de meses actuales o futuros." }
    }
    
    return { isValid: true, errorMsg: "" }
  }

  // Obtener meses disponibles
  const getAvailableMonths = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const existingMonths = monthsByYear[selectedYear] || []
    
    return allMonths
      .filter((month) => !existingMonths.includes(month.value))
      .map((month) => {
        let disabled = false
        if (Number(selectedYear) < currentYear) {
          disabled = true
        } else if (Number(selectedYear) === currentYear && month.number < currentMonth) {
          disabled = true
        }
        return { ...month, disabled }
      })
  }

  // Verificar si se puede agregar meses
  const canAddMonth = () => {
    const currentYear = new Date().getFullYear()
    return Number(selectedYear) >= currentYear
  }

  // Obtener mes actual para highlighting
  const getCurrentMonth = () => {
    const now = new Date()
    const currentYearString = now.getFullYear().toString()
    return selectedYear === currentYearString ? now.getMonth() + 1 : -1
  }

  // Verificar si todos los meses están siendo utilizados
  const areAllMonthsUsed = () => {
    const availableMonths = getAvailableMonths()
    const currentMonths = monthsByYear[selectedYear] || []
    return availableMonths.length === 0 && currentMonths.length === allMonths.length
  }

  return {
    validateAddMonth,
    getAvailableMonths,
    canAddMonth: canAddMonth(),
    currentMonth: getCurrentMonth(),
    areAllMonthsUsed: areAllMonthsUsed()
  }
}
