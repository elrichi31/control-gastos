"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PageHeader } from "@/components/ui/page-layout"
import { NewExpenseButton } from "@/components/gastos/ExpenseDialogProvider"
import { Plus } from "lucide-react"

interface DashboardHeaderProps {
  currentDate: Date
}

export function DashboardHeader({ currentDate }: DashboardHeaderProps) {
  return (
    <PageHeader
      title="Resumen"
      description={<span className="first-letter:uppercase inline-block">{format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</span>}
      actions={
        <NewExpenseButton size="sm" className="max-sm:hidden"><Plus className="w-4 h-4 mr-1.5" />Agregar gasto</NewExpenseButton>
      }
    />
  )
}
