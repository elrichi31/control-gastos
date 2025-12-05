"use client"

import { useState } from "react"
import { Breadcrumb } from "@/components/Breadcrumb"
import { PageTitle } from "@/components/PageTitle"
import { YearSelector } from "@/components/presupuesto/YearSelector"
import { BudgetContent } from "@/components/presupuesto/BudgetContent"
import { useBudgetData } from "@/hooks/useBudgetData"
import { useBudgetValidation } from "@/hooks/useBudgetValidation"

export default function HomePage() {
  const [selectedYear, setSelectedYear] = useState<string>("2025")
  const [isMonthDialogOpen, setIsMonthDialogOpen] = useState(false)
  
  // Hooks personalizados para manejo de datos y validación
  const budgetData = useBudgetData(selectedYear)
  const validation = useBudgetValidation(selectedYear, budgetData.monthsByYear)

  // Manejo de cambio de año
  const handleYearChange = (year: string) => {
    setSelectedYear(year)
    budgetData.initializeYear(year)
  }

  // Manejo de agregar mes con validación
  const handleAddMonth = async (monthValue: string): Promise<boolean> => {
    const { isValid, errorMsg } = validation.validateAddMonth(monthValue)
    
    if (!isValid) {
      budgetData.setErrorMsg(errorMsg)
      return false
    }
    
    return await budgetData.addMonth(monthValue)
  }

  return (
    <div className="p-4 lg:p-8">
      <PageTitle customTitle={`Presupuestos ${selectedYear} - BethaSpend`} />
      <Breadcrumb items={[{ label: "Presupuesto" }]} large />
      
      <div className="mb-8 mt-8">
        <YearSelector selectedYear={selectedYear} setSelectedYear={handleYearChange} />
      </div>
      
      {budgetData.errorMsg && (
        <div className="text-center py-2">
          <p className="text-red-500 font-medium">{budgetData.errorMsg}</p>
        </div>
      )}
      
      {budgetData.isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Cargando presupuestos...</p>
        </div>
      ) : (
        <BudgetContent
          selectedYear={selectedYear}
          monthsByYear={budgetData.monthsByYear}
          dataByYear={budgetData.dataByYear}
          isMonthDialogOpen={isMonthDialogOpen}
          setIsMonthDialogOpen={setIsMonthDialogOpen}
          onAddMonth={handleAddMonth}
          onRemoveMonth={budgetData.removeMonth}
          canAddMonth={validation.canAddMonth}
          currentMonth={validation.currentMonth}
          availableMonths={validation.getAvailableMonths()}
          areAllMonthsUsed={validation.areAllMonthsUsed}
        />
      )}
    </div>
  )
}
