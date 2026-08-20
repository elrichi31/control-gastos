
import { MonthCard } from "./MonthCard"
import { AddMonthCard } from "./AddMonthCard"
import { YearSummary } from "./YearSummary"
import React from "react"

interface MonthData {
  name: string
  value: string
  number: number
}

interface PresupuestoGridProps {
  activeMonths: string[]
  allMonths: MonthData[]
  monthlyData: Record<string, {
    total: number
    expenses: number
    status: "completed" | "in-progress" | "pending"
    trend: "up" | "down" | "stable"
    previousMonth: number
    id: number
  }>
  currentMonth: number
  onRemoveMonth: (monthValue: string) => void
  availableMonths: MonthData[]
  isMonthDialogOpen: boolean
  setIsMonthDialogOpen: (open: boolean) => void
  onAddMonth: (monthValue: string) => void
  canAddMonth: boolean
  selectedYear: string
}

export function PresupuestoGrid({
  activeMonths,
  allMonths,
  monthlyData,
  currentMonth,
  onRemoveMonth,
  availableMonths,
  isMonthDialogOpen,
  setIsMonthDialogOpen,
  onAddMonth,
  canAddMonth,
  selectedYear,
}: PresupuestoGridProps) {
  const getActiveMonths = () =>
    allMonths.filter((month) => activeMonths.includes(month.value)).sort((a, b) => a.number - b.number)

  const ordenados = getActiveMonths()

  return (
    <div className="space-y-6">
      <YearSummary
        monthlyData={monthlyData}
        activeMonths={ordenados.map(m => m.value)}
        anio={selectedYear}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Meses activos */}
      {ordenados.map((month) => {
        const data = monthlyData[month.value] || {
          total: 0,
          expenses: 0,
          status: "pending" as const,
          trend: "stable" as const,
          previousMonth: 0,
        }
        const isCurrentMonth = currentMonth === month.number
        return (
          <MonthCard
            key={month.value}
            month={month}
            data={data}
            isCurrentMonth={isCurrentMonth}
            onRemove={onRemoveMonth}
          />
        )
      })}
      {/* Botón para agregar mes */}
      {canAddMonth && availableMonths.length > 0 && (
        <AddMonthCard
          availableMonths={availableMonths}
          isOpen={isMonthDialogOpen}
          setIsOpen={setIsMonthDialogOpen}
          onAdd={onAddMonth}
        />
      )}
      </div>
    </div>
  )
}
