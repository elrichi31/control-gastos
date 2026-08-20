"use client"

import React, { use, useState } from "react"
import { Breadcrumb } from "@/components/Breadcrumb"
import { useSearchParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import ExpenseModal from "@/components/presupuesto/ExpenseModal"
import { BudgetDetailsContent } from "@/components/presupuesto/BudgetDetailsContent"
import { BudgetSummary } from "@/components/presupuesto/BudgetSummary"
import { useBudgetDetailsData } from "@/hooks/useBudgetDetailsData"
import { useBudgetCalculations } from "@/hooks/useBudgetCalculations"
import { useGastosPorCategoriaDelMes } from "@/hooks/useGastosPorCategoriaDelMes"

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
  const handleEditExpense = (expense: any, categoryId: number) => {
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <Breadcrumb items={[{ label: "Presupuesto", href: "/presupuesto" }, { label: monthName }]} />

      <header className="mt-4 mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {monthName} {anioPresupuesto}
        </h1>
      </header>

      <div className="mb-6">
        <BudgetSummary
          presupuestado={calculations.getBudgetTotal()}
          gastado={calculations.getSpentTotal()}
        />
      </div>

      <BudgetDetailsContent
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
      />

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

      <ExpenseModal
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        formData={budgetData.formData}
        setFormData={budgetData.setFormData}
        metodosPago={budgetData.metodosPago}
        editingExpense={budgetData.editingExpense}
        handleAddExpense={handleSubmitExpense}
        handleUpdateExpense={handleSubmitExpense}
        onCancel={handleCancelExpense}
      />
    </div>
  )
}
