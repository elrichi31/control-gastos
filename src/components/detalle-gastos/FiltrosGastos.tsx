"use client"

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, SlidersHorizontal, X } from 'lucide-react'

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
  if (filters.origin) chips.push({key:'origin', label:`Origen: ${filters.origin === 'email' ? 'Del correo' : 'Manual'}`, reset:''})
  if (filters.dateRange !== 'current-month') chips.push({key:'dateRange', label:filters.dateRange === 'all-time' ? 'Todo el tiempo' : filters.dateRange === 'year' ? `Año: ${filters.year || new Date().getFullYear()}` : `Rango: ${filters.dateFrom || 'inicio'} → ${filters.dateTo || 'sin límite'}`, reset:'current-month'})
  if (filters.minAmount) chips.push({key:'minAmount', label:`Desde $${filters.minAmount}`, reset:''})
  if (filters.maxAmount) chips.push({key:'maxAmount', label:`Hasta $${filters.maxAmount}`, reset:''})
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            aria-label="Buscar gastos"
            maxLength={200}
            placeholder="Buscar gastos..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="h-8 pl-9 text-[13px]"
          />
        </div>

        <FilterPill id="filter-period" label="Período" value={filters.dateRange} onChange={(v) => onFilterChange("dateRange", v)} options={[
          ['current-month', 'Mes actual'], ['year', 'Por año'], ['all-time', 'Todo el tiempo'], ['custom', 'Rango'],
        ]} />
        {filters.dateRange === "year" && (
          <FilterPill id="filter-year" label="Año" value={filters.year || String(new Date().getFullYear())} onChange={(v) => onFilterChange("year", v)}
            options={Array.from({ length: 5 }, (_, i) => { const y = String(new Date().getFullYear() - i); return [y, y] as [string, string] })} />
        )}
        <FilterPill id="filter-category" label="Categoría" value={filters.category || "all"} onChange={(v) => onFilterChange("category", v === "all" ? "" : v)}
          options={[['all', 'Todas'], ...categories.map(c => [String(c.id), c.nombre] as [string, string])]} />
        <FilterPill id="filter-paymentMethod" label="Pago" value={filters.paymentMethod || "all"} onChange={(v) => onFilterChange("paymentMethod", v === "all" ? "" : v)}
          options={[['all', 'Todos'], ...paymentMethods.map(m => [String(m.id), m.nombre] as [string, string])]} />
        <FilterPill id="filter-origin" label="Origen" value={filters.origin || "all"} onChange={(v) => onFilterChange("origin", v === "all" ? "" : v)}
          options={[['all', 'Todos'], ['manual', 'Manual'], ['email', 'Del correo']]} />

        <Button
          variant="outline"
          size="sm"
          aria-expanded={showAdvancedFilters}
          aria-controls="expense-advanced-filters"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="h-8"
        >
          <SlidersHorizontal />
          Más filtros
        </Button>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-8 text-muted-foreground">
            <X />
            Limpiar ({activeFiltersCount})
          </Button>
        )}
      </div>

      {filters.dateRange === "custom" && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="filter-dateFrom" className="text-xs text-muted-foreground">Fecha desde</label>
          <Input id="filter-dateFrom" type="date" value={filters.dateFrom} onChange={(e) => onFilterChange("dateFrom", e.target.value)} className="h-8 w-40 text-[13px] dark:[color-scheme:dark]" />
          <label htmlFor="filter-dateTo" className="text-xs text-muted-foreground">Fecha hasta</label>
          <Input id="filter-dateTo" type="date" value={filters.dateTo} onChange={(e) => onFilterChange("dateTo", e.target.value)} className="h-8 w-40 text-[13px] dark:[color-scheme:dark]" />
        </div>
      )}

      {showAdvancedFilters && (
        <div id="expense-advanced-filters" className="flex flex-wrap items-center gap-2">
          <Input id="filter-minAmount" aria-label="Monto mínimo" type="number" placeholder="Monto mín." value={filters.minAmount} onChange={(e) => onFilterChange("minAmount", e.target.value)} className="h-8 w-32 text-[13px]" />
          <Input id="filter-maxAmount" aria-label="Monto máximo" type="number" placeholder="Monto máx." value={filters.maxAmount} onChange={(e) => onFilterChange("maxAmount", e.target.value)} className="h-8 w-32 text-[13px]" />
          <FilterPill id="filter-sortBy" label="Ordenar" value={filters.sortBy} onChange={(v) => onFilterChange("sortBy", v)}
            options={[['date', 'Fecha'], ['amount', 'Monto'], ['category', 'Categoría'], ['description', 'Descripción']]} />
          <FilterPill id="filter-sortOrder" label="Orden" value={filters.sortOrder} onChange={(v) => onFilterChange("sortOrder", v)}
            options={[['desc', 'Descendente'], ['asc', 'Ascendente']]} />
          <FilterPill id="filter-groupBy" label="Agrupar" value={filters.groupBy} onChange={(v) => onFilterChange("groupBy", v)}
            options={[['none', 'Sin agrupar'], ['day', 'Por día'], ['week', 'Por semana'], ['month', 'Por mes']]} />
        </div>
      )}

      {(chips.length > 0 || filters.dateRange === 'current-month') && (
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Filtros aplicados">
          {filters.dateRange === 'current-month' && <Badge variant="outline" className="font-normal">Mes actual</Badge>}
          {chips.map(chip => <Button key={chip.key} type="button" variant="outline" size="sm" className="h-6 max-w-full gap-1.5 rounded-md px-2 text-xs font-normal" title={chip.label} aria-label={`Quitar filtro: ${chip.label}`} onClick={() => onFilterChange(chip.key, chip.reset)}><span className="truncate">{chip.label}</span><X aria-hidden="true" className="!size-3 shrink-0" /></Button>)}
        </div>
      )}
    </div>
  )
}

/** "Etiqueta | Valor ▾": un solo control con el nombre del filtro pegado a su valor. */
function FilterPill({ id, label, value, onChange, options }: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: [string, string][]
}) {
  return (
    <div className="flex h-8 items-center rounded-lg border border-input bg-card shadow-xs">
      <label htmlFor={id} className="border-r border-input px-2.5 text-xs text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-full w-auto gap-1.5 border-0 bg-transparent px-2.5 text-xs font-semibold shadow-none focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([v, text]) => <SelectItem key={v} value={v}>{text}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}
