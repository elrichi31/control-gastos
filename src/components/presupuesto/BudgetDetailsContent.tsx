// Componente para manejo del contenido principal del detalle de presupuesto
import React from "react"
import { CopyPlus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import CategoriaRow from "@/components/presupuesto/CategoriaRow"
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
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    )
  }

  const hayCategorias = Array.isArray(presupuestoCategorias) && presupuestoCategorias.length > 0

  // Estado vacío: las dos formas de arrancar un mes, una al lado de la otra
  if (!hayCategorias) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
        <h3 className="text-base font-semibold text-foreground">Este mes aún no tiene categorías</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          Agrega categorías una por una o copia la estructura del mes anterior.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-5">
          {availableCategories.length > 0 && (
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Agregar categoría
                </Button>
              </DialogTrigger>
              <SelectorCategorias categories={availableCategories} onAdd={onAddCategory} />
            </Dialog>
          )}
          <Button size="sm" variant="outline" onClick={onCopyFromPreviousMonth}>
            <CopyPlus className="w-4 h-4 mr-1.5" />
            Copiar mes anterior
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {presupuestoCategorias.map(cat => (
        <CategoriaRow
          key={cat.id}
          categoria={cat}
          presupuestado={getBudgetByCategory(cat.categoria_id)}
          gastado={getCategoryTotal(cat.categoria_id)}
          onDeleteCategory={onDeleteCategory}
          onEditExpense={onEditExpense}
          onDeleteExpense={onDeleteExpense}
          onAddExpenseClick={() => onAddExpenseClick(cat.id)}
        />
      ))}

      {availableCategories.length > 0 ? (
        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogTrigger asChild>
            <button className="w-full flex items-center gap-2 px-4 sm:px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t border-border">
              <Plus className="w-4 h-4" />
              Agregar categoría
            </button>
          </DialogTrigger>
          <SelectorCategorias categories={availableCategories} onAdd={onAddCategory} />
        </Dialog>
      ) : (
        <p className="px-5 py-3 text-xs text-muted-foreground border-t border-border">
          Todas las categorías están en uso en este mes.
        </p>
      )}
    </div>
  )
}

function SelectorCategorias({
  categories,
  onAdd,
}: {
  categories: CategoriaDB[]
  onAdd: (id: number) => void
}) {
  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle className="text-base font-semibold">Seleccionar categoría</DialogTitle>
      </DialogHeader>
      <div className="space-y-1.5 max-h-96 overflow-y-auto -mx-1 px-1">
        {categories.map(category => (
          <button
            key={category.id}
            className="w-full flex items-center gap-3 rounded-md border border-border px-3 py-2.5 text-sm text-foreground text-left transition-colors hover:bg-muted"
            onClick={() => onAdd(category.id)}
          >
            {category.icono && <span className="text-base">{category.icono}</span>}
            {category.nombre}
          </button>
        ))}
      </div>
    </DialogContent>
  )
}
