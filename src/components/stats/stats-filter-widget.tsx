"use client"

import { useState, useEffect } from "react"
import { Calendar, X, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface FilterOptions {
  filterType: "year-month" | "year" | "month" | "custom" | "all"
  year: string
  month: string
  dateFrom: string
  dateTo: string
}

interface StatsFilterWidgetProps {
  onFiltersChange: (filters: FilterOptions) => void
}

const months = [
  { value: "enero", label: "Enero" },
  { value: "febrero", label: "Febrero" },
  { value: "marzo", label: "Marzo" },
  { value: "abril", label: "Abril" },
  { value: "mayo", label: "Mayo" },
  { value: "junio", label: "Junio" },
  { value: "julio", label: "Julio" },
  { value: "agosto", label: "Agosto" },
  { value: "septiembre", label: "Septiembre" },
  { value: "octubre", label: "Octubre" },
  { value: "noviembre", label: "Noviembre" },
  { value: "diciembre", label: "Diciembre" },
]

const years = ["2023", "2024", "2025", "2026"]

export function StatsFilterWidget({ onFiltersChange }: StatsFilterWidgetProps) {
  // Obtener mes y año actual
  const getCurrentMonthYear = () => {
    const now = new Date()
    const monthNames = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ]
    return {
      month: monthNames[now.getMonth()],
      year: now.getFullYear().toString()
    }
  }

  const { month: currentMonth, year: currentYear } = getCurrentMonthYear()

  const [filters, setFilters] = useState<FilterOptions>({
    filterType: "all",
    year: currentYear,
    month: currentMonth,
    dateFrom: "",
    dateTo: "",
  })

  // Effect to notify parent when filters change
  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const handleFilterTypeChange = (value: FilterOptions["filterType"]) => {
    setFilters(prev => ({ ...prev, filterType: value }))
  }

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters(prev => ({ ...prev, filterType: "all" }))
  }

  const getActiveFilterLabel = () => {
    switch (filters.filterType) {
      case "year-month":
        return `${filters.month.charAt(0).toUpperCase() + filters.month.slice(1)} ${filters.year}`
      case "year":
        return `Año ${filters.year}`
      case "month":
        return filters.month.charAt(0).toUpperCase() + filters.month.slice(1)
      case "custom":
        if (filters.dateFrom && filters.dateTo) {
          return `${filters.dateFrom} - ${filters.dateTo}`
        }
        return "Rango personalizado"
      default:
        return null
    }
  }

  const activeLabel = getActiveFilterLabel()

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium min-w-fit">
          <Filter className="h-4 w-4" />
          <span>Filtrar por:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-1">
          <Select
            value={filters.filterType}
            onValueChange={handleFilterTypeChange}
          >
            <SelectTrigger className="w-[180px] bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-700">
              <SelectValue placeholder="Seleccionar filtro" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-neutral-900">
              <SelectItem value="all">Todo el historial</SelectItem>
              <SelectItem value="year-month">Año y mes</SelectItem>
              <SelectItem value="year">Solo año</SelectItem>
              <SelectItem value="month">Solo mes</SelectItem>
              <SelectItem value="custom">Rango personalizado</SelectItem>
            </SelectContent>
          </Select>

          {/* Controles adicionales según el tipo de filtro */}
          {(filters.filterType === "year-month" || filters.filterType === "year") && (
            <Select
              value={filters.year}
              onValueChange={(value) => handleFilterChange("year", value)}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(filters.filterType === "year-month" || filters.filterType === "month") && (
            <Select
              value={filters.month}
              onValueChange={(value) => handleFilterChange("month", value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filters.filterType === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="w-auto"
              />
              <span className="text-gray-500">-</span>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="w-auto"
              />
            </div>
          )}
        </div>

        {/* Active Filter Tag */}
        {filters.filterType !== "all" && activeLabel && (
          <div className="flex items-center ml-auto md:ml-0">
            <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5 text-sm font-normal bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800">
              {activeLabel}
              <button
                onClick={clearFilters}
                className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Eliminar filtro</span>
              </button>
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}
