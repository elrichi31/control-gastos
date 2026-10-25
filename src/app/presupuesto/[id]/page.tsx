"use client"

import React, { use, useState } from "react"
import { PageShell, PageHeader } from "@/components/ui/page-layout"
import { Breadcrumb } from "@/components/layout/Breadcrumb"
import { useSearchParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
const ExpenseModal = dynamic(() => import("@/components/presupuesto/ExpenseModal"))
import { BudgetDetailsContent } from "@/components/presupuesto/BudgetDetailsContent"
import { MonthOverview, monthProgress } from "@/components/presupuesto/MonthOverview"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import { useRemoteQuery } from "@/hooks/useRemoteData"
import { useExpensesStore } from "@/hooks/useExpensesStore"
import { fetchBudgetsByYear } from "@/services/budget-general"
import { queryKeys } from "@/lib/query/client"
import { allMonths } from "@/lib/constants"
import { useBudgetDetailsData } from "@/hooks/useBudgetDetailsData"
import { useBudgetCalculations } from "@/hooks/useBudgetCalculations"
import { useGastosPorCategoriaDelMes } from "@/hooks/useGastosPorCategoriaDelMes"
import type { MovimientoPresupuesto } from "@/types"

export default function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const mes = searchParams.get("mes") || ""
  const monthName = mes.charAt(0).toUpperCase() + mes.slice(1)

  // Estados de modales
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)

  // Hook principal de datos
  const budgetData = useBudgetDetailsData(id)

  // Obtener gastos del mes correspondiente
  const mesPresupuesto = budgetData.presupuestoInfo?.mes || new Date().getMonth() + 1
  const anioPresupuesto = budgetData.presupuestoInfo?.anio || new Date().getFullYear()
  const { gastosPorCategoria } = useGastosPorCategoriaDelMes(mesPresupuesto, anioPresupuesto)

  const { gastos } = useExpensesStore()
  const budgetsOfYear = useRemoteQuery([...queryKeys.budgets, String(anioPresupuesto)], () => fetchBudgetsByYear(String(anioPresupuesto), true)).data
  const monthLink = (offset: number) => {
    const target = budgetsOfYear?.find(b => b.anio === anioPresupuesto && b.mes === mesPresupuesto + offset)
    return target ? `/presupuesto/${target.id}?mes=${allMonths[target.mes - 1]?.value}` : null
  }
  const progress = monthProgress(mesPresupuesto, anioPresupuesto)

  // Hook de cálculos
  const calculations = useBudgetCalculations(
    budgetData.presupuestoCategorias,
    budgetData.categoriasDB,
    gastosPorCategoria
  )

  // Manejo de agregar gasto con categoría específica
  const handleAddExpenseClick = (categoryId: number) => {
    budgetData.setFormData({ ...budgetData.formData, category: categoryId.toString() })
    setIsExpenseDialogOpen(true)
  }

  // Manejo de editar gasto
  const handleEditExpense = (expense: MovimientoPresupuesto, categoryId: number) => {
    budgetData.prepareEditExpense(expense, categoryId)
    setIsExpenseDialogOpen(true)
  }

  // Manejo de agregar/actualizar gasto
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = budgetData.editingExpense 
      ? await budgetData.handleUpdateExpense()
      : await budgetData.handleAddExpense()
    
    if (success) {
      setIsExpenseDialogOpen(false)
    }
  }

  // Manejo de cancelar modal de gasto
  const handleCancelExpense = () => {
    setIsExpenseDialogOpen(false)
    budgetData.resetForm()
    budgetData.setEditingExpense(null)
  }

  // Manejo de agregar categoría
  const handleAddCategory = async (categoryId: number) => {
    const success = await budgetData.handleAddCategory(categoryId)
    if (success) {
      setIsCategoryDialogOpen(false)
    }
  }

  if (budgetData.error) return <PageShell><div role="alert" className="space-y-3"><p>No se pudo cargar el presupuesto.</p><Button onClick={() => void budgetData.retry()}>Reintentar</Button></div></PageShell>

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Presupuesto", href: "/presupuesto" }, { label: monthName }]} />

      <PageHeader className="mt-4" title={`${monthName} ${anioPresupuesto}`}
        description={progress.current ? (progress.left > 0 ? `Quedan ${progress.left} ${progress.left === 1 ? "día" : "días"} para que cierre el mes.` : "Hoy cierra el mes.") : progress.left === 0 ? "Este mes ya cerró." : "Este mes aún no empieza."}
        actions={<>
          {([[-1, ChevronLeft, "Mes anterior"], [1, ChevronRight, "Mes siguiente"]] as const).map(([offset, Icon, label]) => {
            const href = monthLink(offset)
            return href
              ? <Button key={label} asChild variant="outline" size="icon" aria-label={label}><Link href={href}><Icon aria-hidden="true" className="size-4" /></Link></Button>
              : <Button key={label} variant="outline" size="icon" aria-label={label} disabled><Icon aria-hidden="true" className="size-4" /></Button>
          })}
          <Button asChild><a href="#categorias"><Pencil aria-hidden="true" className="size-4" />Editar presupuesto</a></Button>
        </>} />

      <div className="mb-6">
        <MonthOverview
          presupuestado={calculations.getBudgetTotal()}
          gastado={calculations.getSpentTotal()}
          mes={mesPresupuesto}
          anio={anioPresupuesto}
          gastos={gastos}
        />
      </div>

      <div id="categorias" className="scroll-mt-4"><BudgetDetailsContent
        metodosPago={budgetData.metodosPago}
        presupuestoCategorias={budgetData.presupuestoCategorias}
        availableCategories={calculations.getAvailableCategoriesForAdd()}
        loading={budgetData.loading}
        isCategoryDialogOpen={isCategoryDialogOpen}
        setIsCategoryDialogOpen={setIsCategoryDialogOpen}
        onAddCategory={handleAddCategory}
        onDeleteCategory={budgetData.handleDeleteCategory}
        onCopyFromPreviousMonth={budgetData.handleCopyFromPreviousMonth}
        onEditExpense={handleEditExpense}
        onDeleteExpense={budgetData.prepareDeleteExpense}
        onAddExpenseClick={handleAddExpenseClick}
        getCategoryTotal={calculations.getCategoryTotal}
        getBudgetByCategory={calculations.getBudgetByCategory}
        mes={mesPresupuesto}
        anio={anioPresupuesto}
      /></div>

      {/* Modal de confirmación de eliminación de gasto */}
      <Dialog open={!!budgetData.expenseToDelete} onOpenChange={(open) => !open && budgetData.setExpenseToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              ¿Eliminar gasto?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              ¿Seguro que quieres eliminar el gasto <span className="font-semibold text-foreground">{budgetData.expenseToDelete?.descripcion}</span>? Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={() => budgetData.setExpenseToDelete(null)}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={budgetData.handleDeleteExpense}
              variant="destructive"
              className="flex-1"
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isExpenseDialogOpen && <ExpenseModal
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        formData={budgetData.formData}
        setFormData={budgetData.setFormData}
        metodosPago={budgetData.metodosPago}
        editingExpense={budgetData.editingExpense}
        handleAddExpense={handleSubmitExpense}
        handleUpdateExpense={handleSubmitExpense}
        onCancel={handleCancelExpense}
      />}
    </PageShell>
  )
}
