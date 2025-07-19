"use client"

import { useMemo } from "react"
import { ExpenseItem } from "@/components/ExpenseItem"
import { Gasto } from "@/hooks/useGastosFiltrados"

interface FilterOptions {
  search: string
  category: string
  paymentMethod: string
  dateRange: "current-month" | "year" | "all-time" | "custom"
  year: string
  dateFrom: string
  dateTo: string
  minAmount: string
  maxAmount: string
}

interface ExpenseListProps {
  expenses: Gasto[]
  filters: FilterOptions
  onDelete: (id: string) => void
}

export function ExpenseList({ expenses, filters, onDelete }: ExpenseListProps) {
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Filtro por búsqueda de texto
      if (filters.search && !expense.descripcion.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }

      // Filtro por categoría
      if (filters.category && expense.categoria?.nombre !== filters.category) {
        return false
      }

      // Filtro por método de pago
      if (filters.paymentMethod && expense.metodo_pago?.nombre !== filters.paymentMethod) {
        return false
      }

      // Filtro por rango de fechas
      switch (filters.dateRange) {
        case "current-month":
          const now = new Date()
          const currentMonth = now.getMonth()
          const currentYear = now.getFullYear()
          
          // Parsear la fecha del gasto (formato YYYY-MM-DD)
          const [year, month, day] = expense.fecha.split('-').map(Number)
          const expenseMonth = month - 1 // Los meses en JavaScript van de 0-11
          const expenseYear = year
          
          // Verificar que el gasto esté en el mes y año actual
          if (expenseMonth !== currentMonth || expenseYear !== currentYear) {
            return false
          }
          break
          
        case "year":
          if (filters.year) {
            const selectedYear = parseInt(filters.year)
            const expenseYear = parseInt(expense.fecha.split('-')[0])
            if (expenseYear !== selectedYear) {
              return false
            }
          }
          break
          
        case "custom":
          // Filtro por fecha desde (comparación de strings en formato YYYY-MM-DD)
          if (filters.dateFrom && expense.fecha < filters.dateFrom) {
            return false
          }
          // Filtro por fecha hasta (comparación de strings en formato YYYY-MM-DD)
          if (filters.dateTo && expense.fecha > filters.dateTo) {
            return false
          }
          break
          
        case "all-time":
          // No aplicar filtro de fecha
          break
      }

      // Filtro por monto mínimo
      if (filters.minAmount && expense.monto < parseFloat(filters.minAmount)) {
        return false
      }

      // Filtro por monto máximo
      if (filters.maxAmount && expense.monto > parseFloat(filters.maxAmount)) {
        return false
      }

      return true
    })
  }, [expenses, filters])

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.monto, 0)
  }, [filteredExpenses])

  if (filteredExpenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg mb-2">No se encontraron gastos</p>
        <p className="text-sm">Intenta ajustar los filtros para ver más resultados</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumen de resultados */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-600 font-medium">
              {filteredExpenses.length} gasto{filteredExpenses.length !== 1 ? 's' : ''} encontrado{filteredExpenses.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-blue-500">
              de {expenses.length} total{expenses.length !== 1 ? 'es' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-blue-900">
              ${totalAmount.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600">Total filtrado</p>
          </div>
        </div>
      </div>

      {/* Lista de gastos */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredExpenses.map((expense) => (
          <ExpenseItem
            key={expense.id}
            expense={expense}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
