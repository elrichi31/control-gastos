// Componente para manejo del contenido principal del detalle de presupuesto
import React from "react"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import CategoriaCard from "@/components/presupuesto/CategoriaCard"
import { PresupuestoCategoriaDetalle, CategoriaDB } from "@/lib/constants"

interface BudgetDetailsContentProps {
  // Datos
  presupuestoCategorias: PresupuestoCategoriaDetalle[]
  availableCategories: CategoriaDB[]
  loading: boolean

  // Estado de modales
  isCategoryDialogOpen: boolean
  setIsCategoryDialogOpen: (open: boolean) => void

  // Funciones de categorías
  onAddCategory: (categoryId: number) => void
  onDeleteCategory: (categoryId: number) => void
  onCopyFromPreviousMonth: () => void

  // Funciones de gastos
  onEditExpense: (expense: any, categoryId: number) => void
  onDeleteExpense: (expense: any) => void
  onAddExpenseClick: (categoryId: number) => void

  // Funciones de cálculo
  getCategoryTotal: (categoryId: number) => number
  getBudgetByCategory: (categoryId: number) => number

  // Info del presupuesto
  mes: number
  anio: number
}

export const BudgetDetailsContent: React.FC<BudgetDetailsContentProps> = ({
  presupuestoCategorias,
  availableCategories,
  loading,
  isCategoryDialogOpen,
  setIsCategoryDialogOpen,
  onAddCategory,
  onDeleteCategory,
  onCopyFromPreviousMonth,
  onEditExpense,
  onDeleteExpense,
  onAddExpenseClick,
  getCategoryTotal,
  getBudgetByCategory,
  mes,
  anio
}) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Cargando información...</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
      {/* Categorías activas */}
      {Array.isArray(presupuestoCategorias) && presupuestoCategorias.length > 0 ? (
        presupuestoCategorias.map((cat) => (
          <CategoriaCard
            key={cat.id}
            categoria={cat}
            onDeleteCategory={onDeleteCategory}
            onEditExpense={onEditExpense}
            onDeleteExpense={onDeleteExpense}
            getCategoryTotal={() => getCategoryTotal(cat.categoria_id)}
            getBudgetByCategory={getBudgetByCategory}
            mes={mes}
            anio={anio}
            onAddExpenseClick={() => onAddExpenseClick(cat.id)}
          />
        ))
      ) : (
        <div className="text-center py-8 col-span-full">
          <p className="text-gray-500 mb-4">No hay categorías para este presupuesto</p>
          <p className="text-sm text-gray-400">Puedes agregar categorías manualmente o copiar del mes anterior</p>
        </div>
      )}

      {/* Botón para agregar categoría */}
      {availableCategories.length > 0 && (
        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogTrigger asChild>
            <Card className="bg-gray-50 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Plus className="w-8 h-8 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-600 mb-1">Agregar categoría</h3>
                <p className="text-sm text-gray-500">Selecciona una categoría para organizar tus gastos</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="bg-white mx-4 max-w-md">
            <DialogHeader>
              <DialogTitle>Seleccionar categoría</DialogTitle>
            </DialogHeader>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableCategories.map((category) => (
                <Button
                  key={category.id}
                  className="w-full justify-start bg-white hover:bg-gray-50 border border-gray-200"
                  onClick={() => onAddCategory(category.id)}
                >
                  <span className="text-xl mr-3">{category.icono}</span>
                  {category.nombre}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Botón para copiar del mes anterior - solo mostrar si no hay categorías */}
      {presupuestoCategorias.length === 0 && (
        <Card 
          className="bg-blue-50 border-2 border-dashed border-blue-300 hover:border-blue-400 transition-colors cursor-pointer"
          onClick={onCopyFromPreviousMonth}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Plus className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="text-lg font-medium text-blue-600 mb-1">Copiar mes anterior</h3>
            <p className="text-sm text-blue-500">Copia las categorías y montos del mes anterior</p>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay categorías disponibles */}
      {availableCategories.length === 0 && presupuestoCategorias.length > 0 && (
        <div className="text-center py-8 col-span-full">
          <p className="text-gray-500">Todas las categorías están siendo utilizadas</p>
        </div>
      )}
    </div>
  )
}