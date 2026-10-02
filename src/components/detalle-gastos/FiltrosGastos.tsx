"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Filter, X } from 'lucide-react'

import type { FilterOptions } from '@/lib/expense-filter-state'
export type { FilterOptions } from '@/lib/expense-filter-state'

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
  const chips: { key: keyof FilterOptions; label: string; reset: string }[] = []
  if (filters.search) chips.push({key:'search', label:`Búsqueda: ${filters.search}`, reset:''})
  if (filters.category) chips.push({key:'category', label:`Categoría: ${categories.find(c => String(c.id) === filters.category)?.nombre || filters.category}`, reset:''})
  if (filters.paymentMethod) chips.push({key:'paymentMethod', label:`Pago: ${paymentMethods.find(m => String(m.id) === filters.paymentMethod)?.nombre || filters.paymentMethod}`, reset:''})
  if (filters.dateRange !== 'current-month') chips.push({key:'dateRange', label:filters.dateRange === 'all-time' ? 'Todo el tiempo' : filters.dateRange === 'year' ? `Año: ${filters.year || new Date().getFullYear()}` : `Rango: ${filters.dateFrom || 'inicio'} → ${filters.dateTo || 'sin límite'}`, reset:'current-month'})
  if (filters.minAmount) chips.push({key:'minAmount', label:`Desde $${filters.minAmount}`, reset:''})
  if (filters.maxAmount) chips.push({key:'maxAmount', label:`Hasta $${filters.maxAmount}`, reset:''})
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-foreground">
          <span className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="font-normal">
              {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Búsqueda principal */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            aria-label="Buscar gastos"
            maxLength={200}
            placeholder="Buscar descripción, categoría o método..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="pl-10 bg-card border-border text-foreground"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2" aria-label="Filtros aplicados">
          {filters.dateRange === 'current-month' && <Badge variant="outline" className="font-normal">Mes actual</Badge>}
          {chips.map(chip => <Button key={chip.key} type="button" variant="outline" size="sm" className="h-8 max-w-full gap-2 font-normal" title={chip.label} aria-label={`Quitar filtro: ${chip.label}`} onClick={() => onFilterChange(chip.key, chip.reset)}><span className="truncate">{chip.label}</span><X aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /></Button>)}
        </div>

        {/* Filtros básicos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="filter-category" className="text-sm font-medium text-foreground">Categoría</label>
            <Select value={filters.category || "all"} onValueChange={(value) => onFilterChange("category", value === "all" ? "" : value)}>
              <SelectTrigger id="filter-category" className="bg-card border-border">
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
            <label htmlFor="filter-paymentMethod" className="text-sm font-medium text-foreground">Método de Pago</label>
            <Select value={filters.paymentMethod || "all"} onValueChange={(value) => onFilterChange("paymentMethod", value === "all" ? "" : value)}>
              <SelectTrigger id="filter-paymentMethod" className="bg-card border-border">
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
            <label htmlFor="filter-period" className="text-sm font-medium text-foreground">Período</label>
            <Select value={filters.dateRange} onValueChange={(value) => onFilterChange("dateRange", value as FilterOptions["dateRange"])}>
              <SelectTrigger id="filter-period" className="bg-card border-border">
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

            {/* Filtros de fecha personalizados */}
            {filters.dateRange === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="filter-dateFrom" className="text-sm font-medium text-foreground">Fecha desde</label>
                  <Input id="filter-dateFrom"
                    className="dark:[color-scheme:dark]"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => onFilterChange("dateFrom", e.target.value)}
                    className="bg-card border-border"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="filter-dateTo" className="text-sm font-medium text-foreground">Fecha hasta</label>
                  <Input id="filter-dateTo"
                    className="dark:[color-scheme:dark]"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => onFilterChange("dateTo", e.target.value)}
                    className="bg-card border-border"
                  />
                </div>
              </div>
            )}

            {/* Filtro de año */}
            {filters.dateRange === "year" && (
              <div className="space-y-2">
                <label htmlFor="filter-year" className="text-sm font-medium text-foreground">Año</label>
                <Select value={filters.year} onValueChange={(value) => onFilterChange("year", value)}>
                  <SelectTrigger id="filter-year" className="w-48 bg-card border-border">
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

        {/* Botón de filtros avanzados */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="outline"
            aria-expanded={showAdvancedFilters}
            aria-controls="expense-advanced-filters"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 bg-card border-border hover:bg-muted"
          >
            <Filter className="w-4 h-4" />
            Filtros avanzados
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              onClick={onClearFilters}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Filtros avanzados */}
        {showAdvancedFilters && (
          <div id="expense-advanced-filters" className="space-y-4 pt-4 border-t border-border">
            {/* Filtros de monto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="filter-minAmount" className="text-sm font-medium text-foreground">Monto mínimo</label>
                <Input id="filter-minAmount"
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => onFilterChange("minAmount", e.target.value)}
                  className="bg-card border-border"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="filter-maxAmount" className="text-sm font-medium text-foreground">Monto máximo</label>
                <Input id="filter-maxAmount"
                  type="number"
                  placeholder="Sin límite"
                  value={filters.maxAmount}
                  onChange={(e) => onFilterChange("maxAmount", e.target.value)}
                  className="bg-card border-border"
                />
              </div>
            </div>

            {/* Ordenamiento y Agrupación */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="filter-sortBy" className="text-sm font-medium text-foreground">Ordenar por</label>
                <Select value={filters.sortBy} onValueChange={(value) => onFilterChange("sortBy", value as FilterOptions["sortBy"])}>
                  <SelectTrigger id="filter-sortBy" className="bg-card border-border">
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
                <label htmlFor="filter-sortOrder" className="text-sm font-medium text-foreground">Orden</label>
                <Select value={filters.sortOrder} onValueChange={(value) => onFilterChange("sortOrder", value as FilterOptions["sortOrder"])}>
                  <SelectTrigger id="filter-sortOrder" className="bg-card border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descendente</SelectItem>
                    <SelectItem value="asc">Ascendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="filter-groupBy" className="text-sm font-medium text-foreground">Agrupar por</label>
                <Select value={filters.groupBy} onValueChange={(value) => onFilterChange("groupBy", value as FilterOptions["groupBy"])}>
                  <SelectTrigger id="filter-groupBy" className="bg-card border-border">
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
