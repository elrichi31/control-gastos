"use client"

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { PageShell, PageHeader } from "@/components/ui/page-layout"
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
      <PageShell>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </PageShell>
    )
  }

  // Error state
  if (error) {
    return (
      <PageShell>
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Error al cargar los gastos: {error}</p>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageTitle customTitle="Detalle de Gastos - BethaSpend" />
      
      <PageHeader
        title="Detalle de gastos"
        description="Análisis detallado y filtrado de todos tus gastos."
        actions={<ExportarDatos gastos={filteredGastos} gastosOriginal={gastos} />}
      />

      <div className="space-y-4">
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
    </PageShell>
  )
}
