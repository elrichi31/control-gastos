"use client"

import React from 'react'
import { Receipt } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { PageTitle } from "@/components/PageTitle"
import { ExportarDatos } from "@/components/detalle-gastos/ExportarDatos"
import { EstadisticasResumen } from "@/components/detalle-gastos/EstadisticasResumen"
import { FiltrosGastos } from "@/components/detalle-gastos/FiltrosGastos"
import { ListaGastosAgrupados } from "@/components/detalle-gastos/ListaGastosAgrupados"
import { useExpenseDetailsData } from "@/hooks/useExpenseDetailsData"
import { useExpenseFilters } from "@/hooks/useExpenseFilters"
import { useExpenseStatistics } from "@/hooks/useExpenseStatistics"
import { formatMoney, formatDate } from "@/lib/utils"

export default function DetalleGastosPage() {
  // Data management
  const { data, loading, error, deleteGasto } = useExpenseDetailsData()

  // Extract data for easier access
  const gastos = data?.gastos || []
  const categories = data?.categories || []
  const paymentMethods = data?.paymentMethods || []

  // Filter management
  const {
    filters,
    filteredGastos,
    showAdvancedFilters,
    activeFiltersCount,
    handleFilterChange,
    clearFilters,
    setShowAdvancedFilters
  } = useExpenseFilters(gastos)

  // Statistics calculation
  const statistics = useExpenseStatistics(filteredGastos)

  // Adapter function for delete to handle string/number conversion
  const handleDeleteGasto = async (id: string) => {
    try {
      await deleteGasto(Number(id))
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  // Loading state
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

  // Error state
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
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 bg-white min-h-screen overflow-x-hidden">
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
        onDeleteGasto={handleDeleteGasto}
        groupBy={filters.groupBy}
      />
    </div>
  )
}