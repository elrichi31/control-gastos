"use client"

import { RecurringExpenseList } from "@/components/gastos-recurrentes/RecurringExpenseList"
import { PageShell, PageHeader } from "@/components/ui/page-layout"
import { PageTitle } from "@/components/layout/PageTitle"
import { Plus } from "lucide-react"
import { NewExpenseButton } from "@/components/gastos/ExpenseDialogProvider"

export default function GastosRecurrentesPage() {
  return (
    <PageShell fill>
      <PageTitle customTitle="Gastos Recurrentes - BethaSpend" />

      <div className="space-y-4 lg:fill-y">
        <PageHeader title="Gastos recurrentes" description="Gestiona tus gastos que se repiten automáticamente."
          actions={<NewExpenseButton kind="recurrente" size="sm"><Plus className="w-4 h-4 mr-1.5" />Nuevo recurrente</NewExpenseButton>} />

        <RecurringExpenseList />
      </div>
    </PageShell>
  )
}
