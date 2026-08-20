"use client"

import React, { useState } from "react"
import { ChevronRight, Edit2, Plus, Trash2, X } from "lucide-react"
import { PresupuestoCategoriaDetalle, MovimientoPresupuesto } from "@/types/budget"
import { formatMoney } from "@/lib/utils"

interface Props {
  categoria: PresupuestoCategoriaDetalle
  presupuestado: number
  gastado: number
  onDeleteCategory: (categoriaId: number) => void
  onEditExpense: (expense: MovimientoPresupuesto, categoryId: number) => void
  onDeleteExpense: (expense: MovimientoPresupuesto) => void
  onAddExpenseClick: () => void
}

function formatFecha(fecha: string) {
  const [y, m, d] = fecha.split("-")
  if (y && m && d) return `${d}/${m}`
  return new Date(fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })
}

/**
 * Fila desplegable por categoría. Antes cada categoría era una tarjeta con su
 * propio bloque de progreso dentro de una cuadrícula de 3 columnas, lo que en
 * móvil obligaba a hacer scroll eterno para comparar dos categorías.
 */
export const CategoriaRow: React.FC<Props> = ({
  categoria,
  presupuestado,
  gastado,
  onDeleteCategory,
  onEditExpense,
  onDeleteExpense,
  onAddExpenseClick,
}) => {
  const [abierto, setAbierto] = useState(false)
  const movimientos = categoria.movimientos ?? []
  const sinMovimientos = movimientos.length === 0

  const porcentaje = presupuestado > 0 ? (gastado / presupuestado) * 100 : 0
  const excedido = presupuestado > 0 && gastado > presupuestado
  const restante = presupuestado - gastado

  const colorBarra = excedido
    ? "bg-chart-5"
    : porcentaje >= 80
      ? "bg-chart-3"
      : "bg-chart-2"

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="group flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-muted/40 transition-colors">
        <button
          onClick={() => setAbierto(v => !v)}
          className="flex-1 min-w-0 flex items-center gap-3 text-left focus-visible:outline-none"
          aria-expanded={abierto}
        >
          <ChevronRight
            className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${abierto ? "rotate-90" : ""}`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-foreground truncate">
                {categoria.categoria.nombre}
              </span>
              <span className="text-sm tabular-nums shrink-0">
                <span className={excedido ? "text-chart-5 font-medium" : "text-foreground font-medium"}>
                  {formatMoney(gastado)}
                </span>
                {presupuestado > 0 && (
                  <span className="text-muted-foreground"> / {formatMoney(presupuestado)}</span>
                )}
              </span>
            </div>

            {/* Sin presupuesto asignado no hay progreso que mostrar */}
            {presupuestado > 0 ? (
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${colorBarra}`}
                    style={{ width: `${Math.min(100, porcentaje)}%` }}
                  />
                </div>
                {/* En móvil solo el %, para no comerse el ancho de la barra */}
                <span
                  className={`text-xs tabular-nums shrink-0 text-right ${
                    excedido ? "text-chart-5" : "text-muted-foreground"
                  }`}
                >
                  <span className="sm:hidden">{Math.round(porcentaje)}%</span>
                  <span className="hidden sm:inline w-28 inline-block">
                    {excedido
                      ? `${formatMoney(Math.abs(restante))} de más`
                      : `${formatMoney(restante)} disponible`}
                  </span>
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                {movimientos.length} {movimientos.length === 1 ? "gasto" : "gastos"} · sin monto presupuestado
              </p>
            )}
          </div>
        </button>

        {sinMovimientos && (
          <button
            onClick={() => onDeleteCategory(categoria.categoria_id)}
            title="Quitar categoría"
            className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 hover:text-destructive hover:bg-muted transition-all shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {abierto && (
        <div className="bg-muted/25 border-t border-border">
          {movimientos.map(expense => (
            <div
              key={expense.id}
              className="group/item flex items-center gap-3 pl-11 pr-4 sm:pr-5 py-2 border-b border-border/60 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">{expense.descripcion}</p>
                <p className="text-xs text-muted-foreground">{formatFecha(expense.fecha)}</p>
              </div>
              <span className="text-sm text-foreground tabular-nums shrink-0">
                {formatMoney(expense.monto)}
              </span>
              <div className="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100 sm:focus-within:opacity-100 transition-opacity">
                <button
                  onClick={() => onEditExpense(expense, categoria.id)}
                  title="Editar"
                  className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteExpense(expense)}
                  title="Eliminar"
                  className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={onAddExpenseClick}
            className="w-full flex items-center gap-2 pl-11 pr-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar gasto
          </button>
        </div>
      )}
    </div>
  )
}

export default CategoriaRow
