"use client"

import React, { use, useState } from "react"
import { Breadcrumb } from "@/components/Breadcrumb"
import { useSearchParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import ExpenseModal from "@/components/presupuesto/ExpenseModal"
import { BudgetDetailsContent } from "@/components/presupuesto/BudgetDetailsContent"
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
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-4 lg:p-8">
      <div className="mb-8">
        <Breadcrumb items={[{ label: "Presupuesto", href: "/presupuesto" }, { label: monthName }]} large />

        <div className="flex flex-col lg:flex-row gap-4 mt-8">
          {/* Card Total Presupuestado */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border dark:border-neutral-700 shadow-sm p-6 flex-1">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Presupuestado</p>
              <p className="text-2xl lg:text-3xl font-bold text-green-600 dark:text-emerald-400">
                ${calculations.getBudgetTotal().toFixed(2)}
              </p>
            </div>
          </div>

          {/* Card Total Gastado */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border dark:border-neutral-700 shadow-sm p-6 flex-1">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Gastado</p>
              <p className="text-2xl lg:text-3xl font-bold text-red-600 dark:text-red-400">
                ${calculations.getSpentTotal().toFixed(2)}
              </p>
            </div>
          </div>

          {/* Card Ahorro/Diferencia */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border dark:border-neutral-700 shadow-sm p-6 flex-1">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {calculations.getBudgetDifference() >= 0 ? 'Ahorro' : 'Exceso'}
              </p>
              <p className={`text-2xl lg:text-3xl font-bold ${
                calculations.getBudgetDifference() >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
              }`}>
                ${Math.abs(calculations.getBudgetDifference()).toFixed(2)}
              </p>
              {calculations.getBudgetDifference() < 0 && (
                <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">Sobre presupuesto</p>
              )}
            </div>
          </div>
        </div>
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
        <DialogContent className="sm:max-w-md dark:bg-neutral-900 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              ¿Eliminar gasto?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿Seguro que quieres eliminar el gasto <span className="font-semibold text-gray-900 dark:text-white">{budgetData.expenseToDelete?.descripcion}</span>? Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={() => budgetData.setExpenseToDelete(null)}
              className="flex-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700"
            >
              Cancelar
            </Button>
            <Button 
              onClick={budgetData.handleDeleteExpense}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
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
