// Componente para manejo del contenido principal del detalle de presupuesto
import React, { useState } from "react"
import { CopyPlus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CategoryDetail } from "@/components/presupuesto/CategoryDetail"
import { getBudgetIndicator } from "@/components/presupuesto/BudgetIndicator"
import { categoryIcon, categoryTile, categoryTone } from "@/lib/expense-icons"
import { formatMoney } from "@/lib/utils"
import { PresupuestoCategoriaDetalle, CategoriaDB } from "@/lib/constants"
import type { MovimientoPresupuesto } from "@/types"

interface BudgetDetailsContentProps {
  // Datos
  presupuestoCategorias: PresupuestoCategoriaDetalle[]
  availableCategories: CategoriaDB[]
  metodosPago: readonly { id: number; nombre: string }[]
  loading: boolean

  // Estado de modales
  isCategoryDialogOpen: boolean
  setIsCategoryDialogOpen: (open: boolean) => void

  // Funciones de categorías
  onAddCategory: (categoryId: number) => void
  onDeleteCategory: (categoryId: number) => void
  onCopyFromPreviousMonth: () => void

  // Funciones de gastos
  onEditExpense: (expense: MovimientoPresupuesto, categoryId: number) => void
  onDeleteExpense: (expense: MovimientoPresupuesto) => void
  onAddExpenseClick: (categoryId: number) => void

  // Funciones de cálculo
  getCategoryTotal: (categoryId: number) => number
  getBudgetByCategory: (categoryId: number) => number

  // Info del presupuesto
  mes: number
  anio: number
}

const TEXT: Record<string, string> = { "bg-chart-2": "text-chart-2", "bg-chart-3": "text-chart-3", "bg-chart-5": "text-chart-5", "bg-muted-foreground": "text-muted-foreground" }

export const BudgetDetailsContent: React.FC<BudgetDetailsContentProps> = ({
  presupuestoCategorias,
  availableCategories,
  metodosPago,
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
  const [selectedId, setSelectedId] = useState<number | null>(null)

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-36 rounded-xl border border-border bg-card animate-pulse" />
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

  const selected = presupuestoCategorias.find(cat => cat.id === selectedId) ?? presupuestoCategorias[0]

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">Por categoría</h2>
        <span className="text-xs text-muted-foreground">Toca una para ver sus gastos</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {presupuestoCategorias.map(cat => {
          const name = cat.categoria.nombre
          const Icon = categoryIcon(name)
          const budget = getBudgetByCategory(cat.categoria_id)
          const spent = getCategoryTotal(cat.categoria_id)
          const state = getBudgetIndicator(budget, spent)
          const left = budget - spent
          const active = cat.id === selected.id
          return (
            <button key={cat.id} type="button" aria-pressed={active} onClick={() => setSelectedId(cat.id)}
              className={`min-w-0 rounded-xl border bg-card p-4 text-left transition-[border-color,box-shadow,scale] duration-150 ease-out active:scale-[0.99] motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-ring ${active ? "border-foreground shadow-sm" : "border-border hover:border-foreground/30"}`}>
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-xl ${categoryTile(name)}`}><Icon className={`size-5 ${categoryTone(name)}`} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">{cat.movimientos.length} {cat.movimientos.length === 1 ? "gasto" : "gastos"}</p>
                </div>
                {budget > 0 && <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${state.tone}`}>{Math.round(state.percentage)}%</span>}
              </div>
              <p className="mt-4 text-2xl font-bold tabular-nums">{formatMoney(spent)}{budget > 0 && <span className="ml-1.5 text-xs font-normal text-muted-foreground">de {formatMoney(budget)}</span>}</p>
              {budget > 0 ? (
                <>
                  <div role="progressbar" aria-label={`Consumo de ${name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(state.percentage))} className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none ${state.bar}`} style={{ width: `${Math.min(100, state.percentage)}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <span className={TEXT[state.bar]}>{state.label}</span>
                    <span className="tabular-nums text-muted-foreground"><span className={`font-semibold ${left < 0 ? "text-chart-5" : "text-chart-2"}`}>{formatMoney(Math.abs(left))}</span> {left < 0 ? "de más" : "disponible"}</span>
                  </div>
                </>
              ) : <p className="mt-3 text-xs text-muted-foreground">Sin monto presupuestado</p>}
            </button>
          )
        })}

        {availableCategories.length > 0 && (
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <button type="button" className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
                <Plus aria-hidden="true" className="size-4" />
                Nueva categoría
              </button>
            </DialogTrigger>
            <SelectorCategorias categories={availableCategories} onAdd={onAddCategory} />
          </Dialog>
        )}
      </div>

      <CategoryDetail
        key={selected.id}
        categoria={selected}
        presupuestado={getBudgetByCategory(selected.categoria_id)}
        gastado={getCategoryTotal(selected.categoria_id)}
        metodosPago={metodosPago}
        onAddExpenseClick={() => onAddExpenseClick(selected.id)}
        onEditExpense={onEditExpense}
        onDeleteExpense={onDeleteExpense}
        onDeleteCategory={onDeleteCategory}
      />
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
