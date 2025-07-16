import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"
import GastoItem from "./GastoItem"
import { PresupuestoCategoriaDetalle, MovimientoPresupuesto } from "@/types/budget"
import BudgetProgressBar from "@/components/BudgetProgressBar"

interface CategoriaCardProps {
  categoria: PresupuestoCategoriaDetalle
  onDeleteCategory: (categoriaId: number) => void
  onEditExpense: (expense: MovimientoPresupuesto, categoryId: number) => void
  onDeleteExpense: (expense: MovimientoPresupuesto) => void
  getCategoryTotal: (cat: PresupuestoCategoriaDetalle) => number
  onAddExpenseClick: () => void
  getBudgetByCategory: (categoriaId: number) => number
}

const CategoriaCard: React.FC<CategoriaCardProps> = ({
  categoria,
  onDeleteCategory,
  onEditExpense,
  onDeleteExpense,
  getCategoryTotal,
  onAddExpenseClick,
  getBudgetByCategory
}) => {
  const categoryExpenses = categoria.movimientos
  const hasExpenses = categoryExpenses.length > 0

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl lg:text-2xl">🏷️</span>
            <div>
              <CardTitle className="text-base lg:text-lg">{categoria.categoria.nombre}</CardTitle>
              <p className="text-sm text-gray-600">{categoryExpenses.length} gastos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">${getCategoryTotal(categoria).toFixed(2)}</Badge>
            {!hasExpenses && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteCategory(categoria.categoria_id)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Barra de progreso de presupuesto */}
        <BudgetProgressBar
          categoria={categoria.categoria.nombre}
          presupuestoTotal={getBudgetByCategory(categoria.categoria_id)}
          presupuestoConsumido={getCategoryTotal(categoria)} // Placeholder, replace with actual logic
          mes={new Date().getMonth() + 1}
          anio={new Date().getFullYear()}
        />
        {categoryExpenses.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No hay gastos en esta categoría</p>
        ) : (
          categoryExpenses.map((expense) => (
            <GastoItem
              key={expense.id}
              expense={expense}
              categoryId={categoria.id}
              onEditExpense={onEditExpense}
              onDeleteExpense={onDeleteExpense}
            />
          ))
        )}
        <Button
          variant="outline"
          className="w-full bg-white text-sm lg:text-base mt-2"
          onClick={onAddExpenseClick}
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar gasto
        </Button>
      </CardContent>
    </Card>
  )
}

export default CategoriaCard
