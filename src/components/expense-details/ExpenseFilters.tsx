"use client"

import { useState } from "react"
import { Search, Filter, X, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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

interface ExpenseFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  categories: Array<{ id: number; nombre: string }>
  paymentMethods: Array<{ id: number; nombre: string }>
  onClearFilters: () => void
}

export function ExpenseFilters({
  filters,
  onFiltersChange,
  categories,
  paymentMethods,
  onClearFilters
}: ExpenseFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const activeFiltersCount = Object.values(filters).filter(value => value !== "" && value !== "current-month").length

  return (
    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gray-50 rounded-lg border">
      {/* Búsqueda principal */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por descripción..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="pl-10 text-sm"
        />
      </div>

      {/* Botón de filtros avanzados */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Filter className="h-4 w-4" />
          Filtros avanzados
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 w-full sm:w-auto"
          >
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
          {/* Período de tiempo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período de tiempo
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange("dateRange", e.target.value as FilterOptions["dateRange"])}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="current-month">Mes actual</option>
              <option value="year">Año específico</option>
              <option value="all-time">Todo el historial</option>
              <option value="custom">Rango personalizado</option>
            </select>
          </div>

          {/* Selector de año (solo cuando dateRange es "year") */}
          {filters.dateRange === "year" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año
              </label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange("year", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Seleccionar año</option>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i
                  return (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  )
                })}
              </select>
            </div>
          )}

          {/* Rango de fechas personalizado (solo cuando dateRange es "custom") */}
          {filters.dateRange === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desde
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hasta
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.nombre}>
                  {category.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de pago
            </label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange("paymentMethod", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Todos los métodos</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.nombre}>
                  {method.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Rango de montos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto mínimo
              </label>
              <Input
                type="number"
                placeholder="$0"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange("minAmount", e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto máximo
              </label>
              <Input
                type="number"
                placeholder="Sin límite"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
