"use client"

import { useState } from "react"
import { Breadcrumb } from "@/components/Breadcrumb"
import { StatsGrid } from "@/components/stats/stats-grid"
import { PieChartWidget } from "@/components/stats/pie-chart-widget"
import { LineChartWidget } from "@/components/stats/line-chart-widget"
import { RadarChartWidget } from "@/components/stats/radar-chart-widget"
import { StatsFilterWidget } from "@/components/stats/stats-filter-widget"
import { QuickAnalysisWidget } from "@/components/stats/quick-analysis-widget"
import { PeriodSummaryWidget } from "@/components/stats/period-summary-widget"
import { InsightsCards } from "@/components/stats/insights-cards"
import { CategoryComparison } from "@/components/stats/category-comparison"
import { PageTitle } from "@/components/PageTitle"
import { useGastosFiltrados } from "@/hooks/useGastosFiltrados"
import { useDataProcessing } from "@/hooks/useDataProcessing"

interface FilterOptions {
  filterType: "year-month" | "year" | "month" | "custom" | "all"
  year: string
  month: string
  dateFrom: string
  dateTo: string
}

export default function EstadisticasPage() {
  const { gastos, loading, error } = useGastosFiltrados()
  
  // Obtener mes y año actuales
  const getCurrentDate = () => {
    const now = new Date()
    const year = now.getFullYear().toString()
    const monthNames = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ]
    const month = monthNames[now.getMonth()]
    return { year, month }
  }

  const { year: currentYear, month: currentMonth } = getCurrentDate()

  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({
    filterType: "year-month",
    year: currentYear,
    month: currentMonth,
    dateFrom: "",
    dateTo: "",
  })

  const {
    filteredGastos,
    categoryData,
    monthlyData,
    radarData,
    totalExpenses,
    monthlyAverage,
    totalTransactions,
    averagePerCategory,
    maxMonth,
    minMonth,
    topCategory,
    categoryPercentage,
    currentMonthStats,
    categoryComparisonStats
  } = useDataProcessing({ gastos, currentFilters })

  const handleFiltersChange = (filters: FilterOptions) => {
    setCurrentFilters(filters)
    console.log("Filtros aplicados:", filters)
  }

  const getChartTitle = () => {
    switch (currentFilters.filterType) {
      case "year-month":
        return "Evolución Diaria de Gastos"
      case "year":
      case "all":
        return "Evolución Mensual de Gastos"
      default:
        return "Evolución de Gastos"
    }
  }

  const getFilterDescription = () => {
    switch (currentFilters.filterType) {
      case "year-month":
        return `${currentFilters.month.charAt(0).toUpperCase() + currentFilters.month.slice(1)} ${currentFilters.year}`
      case "year":
        return `Año ${currentFilters.year}`
      case "month":
        return currentFilters.month.charAt(0).toUpperCase() + currentFilters.month.slice(1)
      case "custom":
        return `${currentFilters.dateFrom} - ${currentFilters.dateTo}`
      case "all":
        return "Todo el historial"
      default:
        return "Todos los períodos"
    }
  }

  const getPageTitle = () => {
    const period = getFilterDescription()
    switch (currentFilters.filterType) {
      case "year-month":
        return `Estadísticas ${period} - BethaSpend`
      case "year":
        return `Estadísticas ${period} - BethaSpend`
      case "month":
        return `Estadísticas de ${period} - BethaSpend`
      case "custom":
        return `Estadísticas ${period} - BethaSpend`
      case "all":
        return "Estadísticas Históricas - BethaSpend"
      default:
        return "Estadísticas Generales - BethaSpend"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-950 dark:to-neutral-900 p-4 lg:p-8">
      <PageTitle customTitle={getPageTitle()} />
      {/* Header mejorado */}
      <div className="mb-8 bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6">
        <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard de Estadísticas</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Análisis detallado de tus gastos y patrones financieros
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{getFilterDescription()}</p>
          </div>
        </div>
      </div>

      {/* Estados de loading y error */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error al cargar los datos: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Layout responsivo mejorado */}
          <div className="space-y-6">
            {/* Filtros horizontal */}
            <StatsFilterWidget onFiltersChange={handleFiltersChange} />

            {/* Métricas principales */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6">
              <StatsGrid
                totalExpenses={totalExpenses}
                monthlyAverage={monthlyAverage}
                totalTransactions={totalTransactions}
                averagePerCategory={averagePerCategory}
                currentMonthStats={currentMonthStats}
                filterType={currentFilters.filterType}
              />
            </div>

            {/* Gráficos principales */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Gráfico de líneas - más ancho */}
              <div className="lg:col-span-8">
                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6 h-full">
                  <LineChartWidget data={monthlyData} title={getChartTitle()} />
                </div>
              </div>

              {/* Gráfico de pie */}
              <div className="lg:col-span-4">
                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6 h-full">
                  <PieChartWidget data={categoryData} title="Distribución por Categorías" />
                </div>
              </div>
            </div>

            {/* Radar y Comparación de Categorías */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Radar Chart */}
              <div className="lg:col-span-5">
                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6 h-full">
                  <RadarChartWidget data={radarData} title="Análisis de Gastos por Categoría" />
                </div>
              </div>

              {/* Comparación de categorías */}
              <div className="lg:col-span-7">
                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6 h-full">
                  <CategoryComparison categoryComparisonStats={categoryComparisonStats} />
                </div>
              </div>
            </div>

            {/* Resumen del período */}
            <div className="grid grid-cols-1">
              <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6">
                <PeriodSummaryWidget
                  maxMonth={maxMonth}
                  minMonth={minMonth}
                  topCategory={topCategory}
                  categoryPercentage={categoryPercentage}
                  totalExpenses={totalExpenses}
                  filteredGastos={filteredGastos}
                  totalTransactions={totalTransactions}
                />
              </div>
            </div>

            {/* Insights adicionales */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6">
              <InsightsCards
                filteredGastos={filteredGastos}
                categoryData={categoryData}
                totalExpenses={totalExpenses}
              />
            </div>

            {/* Widget de análisis rápido - Moved to bottom */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6">
              <QuickAnalysisWidget
                filteredGastos={filteredGastos}
                totalExpenses={totalExpenses}
                monthlyAverage={monthlyAverage}
                categoryData={categoryData}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
