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
}

export function StatsGrid({ totalExpenses, monthlyAverage, totalTransactions, averagePerCategory, currentMonthStats }: StatsGridProps) {
  const { current, previous, changes } = currentMonthStats

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <StatsCard
        title="Gasto Mes Actual"
        value={`$${current.total.toLocaleString()}`}
        subtitle={`Mes anterior: $${previous.total.toLocaleString()}`}
        icon={DollarSign}
        trend={{ 
          value: changes.totalChange, 
          isPositive: changes.totalChange < 0 // Menos gasto es positivo
        }}
        color="text-green-600"
      />
      <StatsCard
        title="Transacciones"
        value={current.transactions.toString()}
        subtitle={`Mes anterior: ${previous.transactions}`}
        icon={Calendar}
        trend={{ 
          value: changes.transactionChange, 
          isPositive: changes.transactionChange < 0 // Menos transacciones como positivo
        }}
        color="text-purple-600"
      />
      <StatsCard
        title="Promedio por Gasto"
        value={`$${Math.round(current.avgPerTransaction).toLocaleString()}`}
        subtitle={`Anterior: $${Math.round(previous.avgPerTransaction).toLocaleString()}`}
        icon={TrendingUp}
        trend={{ 
          value: changes.avgPerTransactionChange, 
          isPositive: changes.avgPerTransactionChange < 0 // Menor promedio es mejor
        }}
        color="text-blue-600"
      />
      <StatsCard
        title="Promedio Mensual"
        value={`$${monthlyAverage.toLocaleString()}`}
        subtitle="Promedio últimos 12 meses"
        icon={BarChart3}
        color="text-orange-600"
      />
    </div>
  )
}
