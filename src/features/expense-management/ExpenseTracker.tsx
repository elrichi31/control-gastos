"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign } from "lucide-react"
import { PageTitle } from "@/components/PageTitle"
import { ExpenseForm, ExpenseSummary } from "./components"
import { ExpenseList } from "@/components/ExpenseList"
import { useFilteredExpenses } from "./hooks"
import { CreateExpenseInput } from "@entities/expense"

export function ExpenseTracker() {
  const {
    filteredExpenses,
    groupedExpenses,
    loading,
    error,
    groupBy,
    handleFilterChange,
    setGroupBy,
    createExpense,
    deleteExpense
  } = useFilteredExpenses()

  const handleDeleteExpense = async (id: string | number) => {
    try {
      await deleteExpense(id)
    } catch (error) {
      console.error("Error al eliminar gasto:", error)
      // Aquí podrías mostrar una notificación de error
    }
  }

  const handleCreateExpense = async (data: CreateExpenseInput) => {
    try {
      await createExpense(data)
    } catch (error) {
      console.error("Error al crear gasto:", error)
      // Aquí podrías mostrar una notificación de error
      throw error // Re-throw para que el componente maneje el error
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Error al cargar los gastos</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full p-4 md:p-6 space-y-6">
        <PageTitle customTitle="Nuevo Gasto - Control de Gastos" />
        
        {/* Header optimizado para móvil */}
        <div className="text-center py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">💰 Nuevo Gasto</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Registra tu gasto de forma rápida y sencilla</p>
        </div>

        {/* Layout responsive: móvil (columna) / desktop (grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Formulario principal - Prioridad en móvil */}
          <div>
            <Card className="shadow-lg rounded-xl border border-gray-200 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Registrar Gasto
                </CardTitle>
                <CardDescription className="text-sm">Completa la información del gasto</CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseForm 
                  onSubmit={handleCreateExpense}
                  isLoading={loading}
                />
              </CardContent>
            </Card>
          </div>

          {/* Resumen - Segundo en móvil */}
          <div>
            <ExpenseSummary
              expenses={filteredExpenses}
              onDateRangeChange={handleFilterChange}
              groupBy={groupBy}
              setGroupBy={setGroupBy}
            />
          </div>

          {/* Lista de gastos - Último en móvil */}
          <div>
            <Card className="shadow-lg rounded-xl border border-gray-200 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg md:text-xl">📝 Gastos Recientes</CardTitle>
                <CardDescription className="text-sm">Últimos gastos agrupados por {groupBy}</CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseList
                  groupedExpenses={groupedExpenses}
                  isLoading={loading}
                  onDelete={handleDeleteExpense}
                  groupBy={groupBy}
                  showDeleteIcon={true}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
