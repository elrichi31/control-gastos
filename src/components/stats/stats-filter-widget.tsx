"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface FilterOptions {
  filterType: "year-month" | "year" | "month" | "custom"
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
    filterType: "year-month",
    year: currentYear,
    month: currentMonth,
    dateFrom: "",
    dateTo: "",
  })

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleApplyFilters = () => {
    onFiltersChange(filters)
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Filtrar por</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo de filtro */}
        <div className="space-y-2">
          <Select
            value={filters.filterType}
            onValueChange={(value: FilterOptions["filterType"]) => handleFilterChange("filterType", value)}
          >
            <SelectTrigger className="bg-gray-50 border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="year-month">Año y mes</SelectItem>
              <SelectItem value="year">Solo año</SelectItem>
              <SelectItem value="month">Solo mes</SelectItem>
              <SelectItem value="custom">Rango personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtros por año y mes */}
        {(filters.filterType === "year-month" || filters.filterType === "year") && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Año</Label>
            <Select value={filters.year} onValueChange={(value) => handleFilterChange("year", value)}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(filters.filterType === "year-month" || filters.filterType === "month") && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Mes</Label>
            <Select value={filters.month} onValueChange={(value) => handleFilterChange("month", value)}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Filtros por rango personalizado */}
        {filters.filterType === "custom" && (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Desde</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  className="bg-gray-50 border-gray-200 pr-10"
                  placeholder="dd/mm/aaaa"
                />
                <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Hasta</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  className="bg-gray-50 border-gray-200 pr-10"
                  placeholder="dd/mm/aaaa"
                />
                <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </>
        )}

        {/* Botón aplicar filtros */}
        <div className="pt-4 border-t border-gray-100">
          <Button onClick={handleApplyFilters} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
            Aplicar filtros
          </Button>
        </div>

        {/* Filtros rápidos */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Filtros rápidos</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-white hover:bg-gray-50"
              onClick={() => {
                const now = new Date()
                const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
                const currentMonth = monthNames[now.getMonth()]
                const currentYear = now.getFullYear().toString()
                const newFilters = { 
                  ...filters, 
                  filterType: "year-month" as const, 
                  month: currentMonth,
                  year: currentYear
                }
                setFilters(newFilters)
                onFiltersChange(newFilters)
              }}
            >
              Este mes
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-white hover:bg-gray-50"
              onClick={() => {
                const currentYear = new Date().getFullYear().toString()
                const newFilters = { ...filters, filterType: "year" as const, year: currentYear }
                setFilters(newFilters)
                onFiltersChange(newFilters)
              }}
            >
              Este año
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-white hover:bg-gray-50"
              onClick={() => {
                const today = new Date()
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
                const lastMonthName = monthNames[lastMonth.getMonth()]
                const lastMonthYear = lastMonth.getFullYear().toString()
                const newFilters = {
                  ...filters,
                  filterType: "year-month" as const,
                  month: lastMonthName,
                  year: lastMonthYear
                }
                setFilters(newFilters)
                onFiltersChange(newFilters)
              }}
            >
              Mes anterior
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
