"use client"

import React, { useState, useMemo } from "react"
import { PageTitle } from "@/components/PageTitle"
import { Card, CardContent } from "@/components/ui/card"
import { Receipt } from "lucide-react"
import { useGastosFiltrados } from "@/hooks/useGastosFiltrados"
import { ExportarDatos } from "@/components/detalle-gastos/ExportarDatos"
import { EstadisticasResumen } from "@/components/detalle-gastos/EstadisticasResumen"
import { FiltrosGastos, FilterOptions } from "@/components/detalle-gastos/FiltrosGastos"
import { ListaGastosAgrupados } from "@/components/detalle-gastos/ListaGastosAgrupados"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function DetalleGastosPage() {
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
    maxAmount: "",
    sortBy: "date",
    sortOrder: "desc",
    groupBy: "none"
  })

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

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

  // Aplicar filtros
  const filteredGastos = useMemo(() => {
    let filtered = [...gastos]

    // Filtro de búsqueda
    if (filters.search) {
      filtered = filtered.filter(gasto =>
        gasto.descripcion.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Filtro de categoría
    if (filters.category) {
      filtered = filtered.filter(gasto => gasto.categoria?.nombre === filters.category)
    }

    // Filtro de método de pago
    if (filters.paymentMethod) {
      filtered = filtered.filter(gasto => gasto.metodo_pago?.nombre === filters.paymentMethod)
    }

    // Filtro de fechas
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    switch (filters.dateRange) {
      case "current-month":
        filtered = filtered.filter(gasto => {
          const gastoDate = new Date(gasto.fecha)
          return gastoDate.getFullYear() === currentYear && gastoDate.getMonth() === currentMonth
        })
        break
      case "year":
        const year = filters.year ? parseInt(filters.year) : currentYear
        filtered = filtered.filter(gasto => {
          const gastoDate = new Date(gasto.fecha)
          return gastoDate.getFullYear() === year
        })
        break
      case "custom":
        if (filters.dateFrom && filters.dateTo) {
          const fromDate = new Date(filters.dateFrom)
          const toDate = new Date(filters.dateTo)
          filtered = filtered.filter(gasto => {
            const gastoDate = new Date(gasto.fecha)
            return gastoDate >= fromDate && gastoDate <= toDate
          })
        }
        break
    }

    // Filtro de montos
    if (filters.minAmount) {
      filtered = filtered.filter(gasto => gasto.monto >= parseFloat(filters.minAmount))
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(gasto => gasto.monto <= parseFloat(filters.maxAmount))
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (filters.sortBy) {
        case "date":
          comparison = new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          break
        case "amount":
          comparison = a.monto - b.monto
          break
        case "category":
          comparison = (a.categoria?.nombre || "").localeCompare(b.categoria?.nombre || "")
          break
        case "description":
          comparison = a.descripcion.localeCompare(b.descripcion)
          break
      }

      return filters.sortOrder === "desc" ? -comparison : comparison
    })

    return filtered
  }, [gastos, filters])

  // Estadísticas de los gastos filtrados
  const statistics = useMemo(() => {
    const total = filteredGastos.reduce((sum, gasto) => sum + gasto.monto, 0)
    const count = filteredGastos.length
    const average = count > 0 ? total / count : 0
    
    const categoryStats = filteredGastos.reduce((acc, gasto) => {
      const category = gasto.categoria?.nombre || "Sin categoría"
      acc[category] = (acc[category] || 0) + gasto.monto
      return acc
    }, {} as Record<string, number>)

    return { total, count, average, categoryStats }
  }, [filteredGastos])

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      paymentMethod: "",
      dateRange: "current-month",
      year: "",
      dateFrom: "",
      dateTo: "",
      minAmount: "",
      maxAmount: "",
      sortBy: "date",
      sortOrder: "desc",
      groupBy: "none"
    })
  }

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => 
    key !== "sortBy" && key !== "sortOrder" && key !== "groupBy" && value !== "" && value !== "current-month"
  ).length

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: es })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-white min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-white min-h-screen">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error al cargar los gastos: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-white min-h-screen">
      <PageTitle customTitle="Detalle de Gastos - Control de Gastos" />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="w-8 h-8" />
              Detalle de Gastos
            </h1>
            <p className="text-gray-600 mt-1">
              Análisis detallado y filtrado de todos tus gastos
            </p>
          </div>
          
          <div className="flex gap-2">
            <ExportarDatos gastos={filteredGastos} gastosOriginal={gastos} />
          </div>
        </div>
      </div>

      {/* Estadísticas resumidas */}
      <EstadisticasResumen 
        statistics={statistics} 
        formatMoney={formatMoney} 
      />

      {/* Filtros */}
      <FiltrosGastos
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        categories={categories}
        paymentMethods={paymentMethods}
        activeFiltersCount={activeFiltersCount}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
      />

      {/* Lista de gastos */}
      <ListaGastosAgrupados
        gastos={filteredGastos}
        activeFiltersCount={activeFiltersCount}
        formatMoney={formatMoney}
        formatDate={formatDate}
        onDeleteGasto={deleteGasto}
        groupBy={filters.groupBy}
      />
    </div>
  )
}
