"use client"

import { EmptyMonths } from "@/components/presupuesto/EmptyMonths"
import { PresupuestoGrid } from "@/components/presupuesto/PresupuestoGrid"
import { allMonths } from "@/lib/constants"
import type { MonthlyDataGrid } from "@/services/budget-general"

interface BudgetContentProps {
  selectedYear: string
  monthsByYear: { [year: string]: string[] }
  dataByYear: { [year: string]: MonthlyDataGrid }
  isMonthDialogOpen: boolean
  setIsMonthDialogOpen: (open: boolean) => void
  onAddMonth: (monthValue: string) => Promise<boolean>
  onRemoveMonth: (monthValue: string) => Promise<boolean>
  // Validation props
  canAddMonth: boolean
  currentMonth: number
  availableMonths: { name: string; value: string; number: number; disabled?: boolean }[]
  areAllMonthsUsed: boolean
}

export function BudgetContent({
  selectedYear,
  monthsByYear,
  dataByYear,
  isMonthDialogOpen,
  setIsMonthDialogOpen,
  onAddMonth,
  onRemoveMonth,
  canAddMonth,
  currentMonth,
  availableMonths,
  areAllMonthsUsed
}: BudgetContentProps) {
  const currentMonths = monthsByYear[selectedYear] || []
  const monthlyData = dataByYear[selectedYear] || {}

  // Manejo de agregar mes con validación
  const handleAddMonth = async (monthValue: string) => {
    const success = await onAddMonth(monthValue)
    if (success) {
      setIsMonthDialogOpen(false)
    }
  }

  // Si no hay meses creados
  if (currentMonths.length === 0) {
    if (canAddMonth) {
      return (
        <EmptyMonths
          allMonths={availableMonths}
          isOpen={isMonthDialogOpen}
          setIsOpen={setIsMonthDialogOpen}
          onAdd={handleAddMonth}
        />
      )
    } else {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No puedes crear presupuestos para años anteriores.</p>
        </div>
      )
    }
  }

  // Si hay meses creados
  return (
    <>
      <PresupuestoGrid
        activeMonths={currentMonths}
        allMonths={allMonths}
        monthlyData={monthlyData}
        currentMonth={currentMonth}
        onRemoveMonth={onRemoveMonth}
        availableMonths={availableMonths}
        isMonthDialogOpen={isMonthDialogOpen}
        setIsMonthDialogOpen={setIsMonthDialogOpen}
        onAddMonth={canAddMonth ? handleAddMonth : () => {}}
        canAddMonth={canAddMonth}
      />
      
      {/* Mensaje cuando todos los meses están siendo utilizados */}
      {areAllMonthsUsed && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Todos los meses del año están siendo utilizados</p>
        </div>
      )}
    </>
  )
}
