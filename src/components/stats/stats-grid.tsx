"use client"

import { DollarSign, TrendingUp, Calendar, BarChart3 } from "lucide-react"
import { StatsCard } from "./stats-card"

interface StatsGridProps {
  totalExpenses: number
  monthlyAverage: number
  totalTransactions: number
  averagePerCategory: number
  currentMonthStats: {
    current: { total: number; transactions: number; avgPerTransaction: number }
    previous: { total: number; transactions: number; avgPerTransaction: number }
    changes: { totalChange: number; transactionChange: number; avgPerTransactionChange: number }
  }
  filterType?: string
}

export function StatsGrid({
  totalExpenses,
  monthlyAverage,
  totalTransactions,
  averagePerCategory,
  currentMonthStats,
  filterType = "year-month"
}: StatsGridProps) {
  const { current, previous, changes } = currentMonthStats

  // Adaptar títulos según el filtro
  const getMainTitle = () => {
    switch (filterType) {
      case "year-month": return "Gasto del Mes"
      case "year": return "Gasto del Año"
      case "month": return "Gasto del Mes"
      case "custom": return "Gasto del Período"
      case "all": return "Gasto Total"
      default: return "Gasto del Período"
    }
  }

  const showTrend = filterType !== "all"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <StatsCard
        title={getMainTitle()}
        value={`$${totalExpenses.toLocaleString()}`}
        subtitle={showTrend ? `Anterior: $${previous.total.toLocaleString()}` : "Histórico completo"}
        icon={DollarSign}
        trend={showTrend ? {
          value: changes.totalChange,
          isPositive: changes.totalChange < 0
        } : undefined}
        color="text-green-600"
      />
      <StatsCard
        title="Transacciones"
        value={totalTransactions.toString()}
        subtitle={showTrend ? `Anterior: ${previous.transactions}` : "Total de gastos"}
        icon={Calendar}
        trend={showTrend ? {
          value: changes.transactionChange,
          isPositive: changes.transactionChange < 0
        } : undefined}
        color="text-purple-600"
      />
      <StatsCard
        title="Promedio por Gasto"
        value={`$${Math.round(totalTransactions > 0 ? totalExpenses / totalTransactions : 0).toLocaleString()}`}
        subtitle={showTrend ? `Anterior: $${Math.round(previous.avgPerTransaction).toLocaleString()}` : "Por transacción"}
        icon={TrendingUp}
        trend={showTrend ? {
          value: changes.avgPerTransactionChange,
          isPositive: changes.avgPerTransactionChange < 0
        } : undefined}
        color="text-blue-600"
      />
      <StatsCard
        title="Promedio Mensual"
        value={`$${monthlyAverage.toLocaleString()}`}
        subtitle={filterType === "all" ? "Promedio histórico" : "Promedio del período"}
        icon={BarChart3}
        color="text-orange-600"
      />
    </div>
  )
}
