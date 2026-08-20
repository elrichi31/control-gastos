"use client"

import { useState } from "react"
import { StatsFilterWidget } from "@/components/stats/stats-filter-widget"
import { StatTile, StatTileRow } from "@/components/stats/stat-tile"
import { EvolutionChart } from "@/components/stats/evolution-chart"
import { CategoryRanking } from "@/components/stats/category-ranking"
import { PaymentMethodChart, WeekdayChart, FixedVsVariable } from "@/components/stats/breakdown-charts"
import { ProjectionCard } from "@/components/stats/projection-card"
import { TopExpenses } from "@/components/stats/top-expenses"
import { PageTitle } from "@/components/PageTitle"
import { useGastosFiltrados } from "@/hooks/useGastosFiltrados"
import { useDataProcessing } from "@/hooks/useDataProcessing"
import { useStatsAnalytics, type FilterOptions } from "@/hooks/useStatsAnalytics"
import { formatMoney } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function EstadisticasPage() {
  const { gastos, loading, error } = useGastosFiltrados()

  const getCurrentDate = () => {
    const now = new Date()
    const monthNames = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
    ]
    return { year: now.getFullYear().toString(), month: monthNames[now.getMonth()] }
  }

  const { year: currentYear, month: currentMonth } = getCurrentDate()

  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({
    filterType: "year-month",
    year: currentYear,
    month: currentMonth,
    dateFrom: "",
    dateTo: "",
  })

  const { filteredGastos } = useDataProcessing({ gastos, currentFilters })
  const a = useStatsAnalytics(gastos, currentFilters, filteredGastos)

  const descripcionPeriodo = () => {
    switch (currentFilters.filterType) {
      case "year-month":
        return `${currentFilters.month.charAt(0).toUpperCase() + currentFilters.month.slice(1)} ${currentFilters.year}`
      case "year":
        return `Año ${currentFilters.year}`
      case "month":
        return currentFilters.month.charAt(0).toUpperCase() + currentFilters.month.slice(1)
      case "custom":
        return `${currentFilters.dateFrom} — ${currentFilters.dateTo}`
      case "all":
        return "Todo el historial"
      default:
        return "Todos los períodos"
    }
  }

  const etiquetaPrevio = a.previo
    ? format(a.previo.desde, currentFilters.filterType === "year" ? "yyyy" : "MMMM", { locale: es })
    : undefined

  const tituloEvolucion =
    currentFilters.filterType === "year-month" ? "Evolución diaria" : "Evolución del período"

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageTitle customTitle={`Estadísticas ${descripcionPeriodo()} - BethaSpend`} />

      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Estadísticas</h1>
        <p className="text-muted-foreground mt-1">
          Análisis de tus gastos en <span className="text-foreground font-medium">{descripcionPeriodo()}</span>
          {a.kpis.hayComparacion && etiquetaPrevio ? `, comparado con ${etiquetaPrevio}.` : "."}
        </p>
      </header>

      {loading && (
        <div className="space-y-4">
          <div className="h-24 rounded-xl border border-border bg-card animate-pulse" />
          <div className="h-80 rounded-xl border border-border bg-card animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-64 rounded-xl border border-border bg-card animate-pulse" />
            <div className="h-64 rounded-xl border border-border bg-card animate-pulse" />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 mb-6">
          <p className="text-sm text-destructive">Error al cargar los datos: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          <StatsFilterWidget onFiltersChange={setCurrentFilters} />

          {/* Fila de KPIs, cada uno con su variación contra el período anterior */}
          <StatTileRow>
            <StatTile etiqueta="Gasto total" valor={formatMoney(a.kpis.total)} delta={a.kpis.totalDelta} />
            <StatTile
              etiqueta={a.enCurso ? "Promedio diario (a hoy)" : "Promedio diario"}
              valor={formatMoney(a.kpis.promedioDiario)}
              delta={a.kpis.promedioDiarioDelta}
            />
            <StatTile
              etiqueta="Transacciones"
              valor={String(a.kpis.transacciones)}
              delta={a.kpis.transaccionesDelta}
              invertirColor={false}
            />
            <StatTile etiqueta="Ticket promedio" valor={formatMoney(a.kpis.ticket)} delta={a.kpis.ticketDelta} />
          </StatTileRow>

          {/* Solo aparece si el período elegido está en curso */}
          {a.proyeccion && <ProjectionCard proyeccion={a.proyeccion} />}

          <EvolutionChart
            diario={a.evolucion}
            acumulado={a.acumulado}
            titulo={tituloEvolucion}
            etiquetaPrevio={etiquetaPrevio}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-7">
              <CategoryRanking categorias={a.porCategoria} concentracion={a.concentracion} />
            </div>
            <div className="lg:col-span-5">
              <PaymentMethodChart metodos={a.porMetodoPago} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <WeekdayChart dias={a.porDiaSemana} />
            <FixedVsVariable composicion={a.composicion} />
          </div>

          <TopExpenses gastos={a.topGastos} />

          {/* Cierre con datos de hábito, que no dan para un gráfico */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4">
              <p className="text-xs font-medium text-muted-foreground">Días con gasto</p>
              <p className="text-2xl font-semibold text-foreground tabular-nums mt-1">{a.diasConGasto}</p>
              <p className="text-xs text-muted-foreground mt-1.5">de {a.diasTranscurridos} días</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs font-medium text-muted-foreground">Días sin gastar</p>
              <p className="text-2xl font-semibold text-foreground tabular-nums mt-1">{a.diasSinGasto}</p>
              <p className="text-xs text-muted-foreground mt-1.5">
                {a.diasTranscurridos > 0
                  ? `${((a.diasSinGasto / a.diasTranscurridos) * 100).toFixed(0)}% del período`
                  : "—"}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs font-medium text-muted-foreground">Categorías activas</p>
              <p className="text-2xl font-semibold text-foreground tabular-nums mt-1">{a.porCategoria.length}</p>
              <p className="text-xs text-muted-foreground mt-1.5">
                {a.porCategoria[0] ? `Mayor: ${a.porCategoria[0].nombre}` : "—"}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs font-medium text-muted-foreground">Concentración</p>
              <p className="text-2xl font-semibold text-foreground tabular-nums mt-1">
                {a.concentracion.toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">en las 3 principales</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
