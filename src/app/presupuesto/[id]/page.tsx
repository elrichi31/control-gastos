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
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <Breadcrumb items={[{ label: "Presupuesto", href: "/presupuesto" }, { label: monthName }]} large />

        <div className="flex flex-col lg:flex-row gap-4 mt-8">
          {/* Card Total Presupuestado */}
          <div className="bg-white rounded-lg border shadow-sm p-6 flex-1">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Total Presupuestado</p>
              <p className="text-2xl lg:text-3xl font-bold text-green-600">
                ${calculations.getBudgetTotal().toFixed(2)}
              </p>
            </div>
          </div>

          {/* Card Total Gastado */}
          <div className="bg-white rounded-lg border shadow-sm p-6 flex-1">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Total Gastado</p>
              <p className="text-2xl lg:text-3xl font-bold text-red-600">
                ${calculations.getSpentTotal().toFixed(2)}
              </p>
            </div>
          </div>

          {/* Card Ahorro/Diferencia */}
          <div className="bg-white rounded-lg border shadow-sm p-6 flex-1">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                {calculations.getBudgetDifference() >= 0 ? 'Ahorro' : 'Exceso'}
              </p>
              <p className={`text-2xl lg:text-3xl font-bold ${
                calculations.getBudgetDifference() >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                ${Math.abs(calculations.getBudgetDifference()).toFixed(2)}
              </p>
              {calculations.getBudgetDifference() < 0 && (
                <p className="text-xs text-orange-500 mt-1">Sobre presupuesto</p>
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
        <DialogContent className="bg-white mx-4 max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar gasto?</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-gray-700">
              ¿Seguro que quieres eliminar el gasto <span className="font-semibold">{budgetData.expenseToDelete?.descripcion}</span>? Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex gap-2 pt-4">
            <Button 
              className="flex-1 bg-red-500 hover:bg-red-600 text-white" 
              onClick={budgetData.handleDeleteExpense}
            >
              Eliminar
            </Button>
            <Button 
              className="flex-1 bg-white border border-gray-200 hover:bg-gray-50" 
              onClick={() => budgetData.setExpenseToDelete(null)}
            >
              Cancelar
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
