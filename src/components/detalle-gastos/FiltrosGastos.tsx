"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Filter, X } from 'lucide-react'

export interface FilterOptions {
  search: string
  category: string
  paymentMethod: string
  dateRange: "current-month" | "year" | "all-time" | "custom"
  year: string
  dateFrom: string
  dateTo: string
  minAmount: string
  maxAmount: string
  sortBy: "date" | "amount" | "category" | "description"
  sortOrder: "asc" | "desc"
  groupBy: "none" | "day" | "week" | "month"
}

interface FiltrosGastosProps {
  filters: FilterOptions
  onFilterChange: (key: keyof FilterOptions, value: string) => void
  onClearFilters: () => void
  categories: Array<{ id: number; nombre: string }>
  paymentMethods: Array<{ id: number; nombre: string }>
  activeFiltersCount: number
  showAdvancedFilters: boolean
  setShowAdvancedFilters: (show: boolean) => void
}

export function FiltrosGastos({
  filters,
  onFilterChange,
  onClearFilters,
  categories,
  paymentMethods,
  activeFiltersCount,
  showAdvancedFilters,
  setShowAdvancedFilters
}: FiltrosGastosProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">
              {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Búsqueda principal */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por descripción del gasto..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros básicos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Categoría</label>
            <Select value={filters.category || "all"} onValueChange={(value) => onFilterChange("category", value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Método de Pago</label>
            <Select value={filters.paymentMethod || "all"} onValueChange={(value) => onFilterChange("paymentMethod", value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los métodos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id.toString()}>
                    {method.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Período</label>
            <Select value={filters.dateRange} onValueChange={(value) => onFilterChange("dateRange", value as FilterOptions["dateRange"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Mes actual</SelectItem>
                <SelectItem value="year">Por año</SelectItem>
                <SelectItem value="all-time">Todo el tiempo</SelectItem>
                <SelectItem value="custom">Rango personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botón de filtros avanzados */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros avanzados
          </Button>
          
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              onClick={onClearFilters}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Filtros avanzados */}
        {showAdvancedFilters && (
          <div className="space-y-4 pt-4 border-t">
            {/* Filtros de fecha personalizados */}
            {filters.dateRange === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Fecha desde</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => onFilterChange("dateFrom", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Fecha hasta</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => onFilterChange("dateTo", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Filtro de año */}
            {filters.dateRange === "year" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Año</label>
                <Select value={filters.year} onValueChange={(value) => onFilterChange("year", value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Selecciona un año" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Filtros de monto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Monto mínimo</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => onFilterChange("minAmount", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Monto máximo</label>
                <Input
                  type="number"
                  placeholder="Sin límite"
                  value={filters.maxAmount}
                  onChange={(e) => onFilterChange("maxAmount", e.target.value)}
                />
              </div>
            </div>

            {/* Ordenamiento y Agrupación */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ordenar por</label>
                <Select value={filters.sortBy} onValueChange={(value) => onFilterChange("sortBy", value as FilterOptions["sortBy"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Fecha</SelectItem>
                    <SelectItem value="amount">Monto</SelectItem>
                    <SelectItem value="category">Categoría</SelectItem>
                    <SelectItem value="description">Descripción</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Orden</label>
                <Select value={filters.sortOrder} onValueChange={(value) => onFilterChange("sortOrder", value as FilterOptions["sortOrder"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descendente</SelectItem>
                    <SelectItem value="asc">Ascendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Agrupar por</label>
                <Select value={filters.groupBy} onValueChange={(value) => onFilterChange("groupBy", value as FilterOptions["groupBy"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin agrupar</SelectItem>
                    <SelectItem value="day">Por día</SelectItem>
                    <SelectItem value="week">Por semana</SelectItem>
                    <SelectItem value="month">Por mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
