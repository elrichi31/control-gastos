"use client"

import { useState, useMemo } from "react"
import { X, Receipt, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExpenseFilters } from "./ExpenseFilters"
import { ExpenseList } from "./ExpenseList"
import { useGastosFiltrados, Gasto } from "@/shared/hooks/useGastosFiltrados"

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

interface ExpenseDetailsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function ExpenseDetailsPanel({ isOpen, onClose }: ExpenseDetailsPanelProps) {
  const { gastos, loading, error, deleteGasto } = useGastosFiltrados()
  
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    category: "",
    paymentMethod: "",
    dateRange: "current-month",
    year: "",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: ""
  })

  // Extraer categorías y métodos de pago únicos
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(gastos.map(gasto => gasto.categoria?.nombre).filter(Boolean))
    ).map((nombre, index) => ({ id: index + 1, nombre: nombre! }))
    return uniqueCategories
  }, [gastos])

  const paymentMethods = useMemo(() => {
    const uniqueMethods = Array.from(
      new Set(gastos.map(gasto => gasto.metodo_pago?.nombre).filter(Boolean))
    ).map((nombre, index) => ({ id: index + 1, nombre: nombre! }))
    return uniqueMethods
  }, [gastos])

  const handleClearFilters = () => {
    setFilters({
      search: "",
      category: "",
      paymentMethod: "",
      dateRange: "current-month",
      year: "",
      dateFrom: "",
      dateTo: "",
      minAmount: "",
      maxAmount: ""
    })
  }

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteGasto(id)
    } catch (error) {
      console.error("Error al eliminar gasto:", error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
      <div className="bg-white w-full sm:max-w-md h-full overflow-hidden flex flex-col sm:shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                Detalle de Gastos
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                Explora y filtra todos tus gastos
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading && (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="p-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">Error: {error}</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Estadísticas rápidas */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-xs text-gray-600">Total gastos</p>
                        <p className="font-bold text-gray-900 text-sm sm:text-base">
                          ${gastos.reduce((sum, g) => sum + g.monto, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-600">Transacciones</p>
                        <p className="font-bold text-gray-900 text-sm sm:text-base">{gastos.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div className="p-4 border-b">
                <ExpenseFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={categories}
                  paymentMethods={paymentMethods}
                  onClearFilters={handleClearFilters}
                />
              </div>

              {/* Lista de gastos */}
              <div className="flex-1 overflow-y-auto p-4">
                <ExpenseList
                  expenses={gastos}
                  filters={filters}
                  onDelete={handleDeleteExpense}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
