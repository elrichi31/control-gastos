"use client"

import { DollarSign, TrendingUp, Calendar, BarChart3 } from "lucide-react"
import { StatsCard } from "./stats-card"

interface StatsGridProps {
  totalExpenses: number
  monthlyAverage: number
  totalTransactions: number
  averagePerCategory: number
}

export function StatsGrid({ totalExpenses, monthlyAverage, totalTransactions, averagePerCategory }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <StatsCard
        title="Total Gastado"
        value={`$${totalExpenses.toLocaleString()}`}
        subtitle="En los últimos 6 meses"
        icon={DollarSign}
        trend={{ value: 12.5, isPositive: true }}
        color="text-green-600"
      />
      <StatsCard
        title="Promedio Mensual"
        value={`$${monthlyAverage.toLocaleString()}`}
        subtitle="Gasto promedio por mes"
        icon={TrendingUp}
        trend={{ value: -3.2, isPositive: false }}
        color="text-blue-600"
      />
      <StatsCard
        title="Total Transacciones"
        value={totalTransactions}
        subtitle="Gastos registrados"
        icon={Calendar}
        color="text-purple-600"
      />
      <StatsCard
        title="Promedio por Categoría"
        value={`$${averagePerCategory.toLocaleString()}`}
        subtitle="Gasto promedio por categoría"
        icon={BarChart3}
        trend={{ value: 8.1, isPositive: true }}
        color="text-orange-600"
      />
    </div>
  )
}
