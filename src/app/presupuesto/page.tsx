"use client"

import { useState } from "react"
import { PageShell, PageHeader } from "@/components/ui/page-layout"
import { PageTitle } from "@/components/layout/PageTitle"
import { YearSelector } from "@/components/presupuesto/YearSelector"
import { BudgetContent } from "@/components/presupuesto/BudgetContent"
import { useBudgetData } from "@/hooks/useBudgetData"
import { useBudgetValidation } from "@/hooks/useBudgetValidation"

export default function HomePage() {
  const currentYear = new Date().getFullYear().toString()
  const [selectedYear, setSelectedYear] = useState<string>(currentYear)
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
    <PageShell>
      <PageTitle customTitle={`Presupuestos ${selectedYear} - BethaSpend`} />

      {/* Título y selector de año en la misma línea; en móvil se apilan */}
      <PageHeader title="Presupuesto" description="Planifica y sigue tu gasto mes a mes."
        actions={<YearSelector selectedYear={selectedYear} setSelectedYear={handleYearChange} />} />

      {budgetData.errorMsg && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 mb-4">
          <p className="text-sm text-destructive">{budgetData.errorMsg}</p>
        </div>
      )}

      {budgetData.isLoading ? (
        <div className="space-y-6">
          <div className="h-24 rounded-xl border border-border bg-card animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-[124px] rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
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
    </PageShell>
  )
}
