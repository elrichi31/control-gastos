"use client"

import { TrendingUp, TrendingDown, Calendar, ShoppingCart, CreditCard, DollarSign, PiggyBank } from "lucide-react"
import { StatCard } from "./StatCard"
import { formatMoney } from "@/lib/utils"

interface SummaryCardsProps {
  currentMonthTotal: number
  todayTotal: number
  todayCount: number
  topCategory: { name: string; total: number }
  totalExpenses: number
  currentMonthCount: number
  monthlyChange: number
  monthlyChangePercentage: number
  budgetTotal?: number
  savingsAmount?: number
}

export function SummaryCards({
  currentMonthTotal,
  todayTotal,
  todayCount,
  topCategory,
  totalExpenses,
  currentMonthCount,
  monthlyChange,
  monthlyChangePercentage,
  budgetTotal,
  savingsAmount
}: SummaryCardsProps) {
  const hasBudget = budgetTotal !== undefined && budgetTotal > 0
  const savings = savingsAmount !== undefined ? savingsAmount : 0
  const isOverBudget = savings < 0

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${hasBudget ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4 sm:gap-6 mb-8`}>
      {/* Gasto del mes */}
      <StatCard
        title="Este mes"
        value={formatMoney(currentMonthTotal)}
        colorScheme="blue"
        icon={DollarSign}
        subtitle={
          <div className="flex items-center">
            {monthlyChange >= 0 ? (
              <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
            )}
            <span className={`text-sm ${monthlyChange >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {Math.abs(monthlyChangePercentage).toFixed(1)}% vs mes anterior
            </span>
          </div>
        }
      />

      {/* Gasto de hoy */}
      <StatCard
        title="Hoy"
        value={formatMoney(todayTotal)}
        colorScheme="green"
        icon={Calendar}
        subtitle={
          <p className="text-sm text-green-600 dark:text-gray-400">
            {todayCount} transacción{todayCount !== 1 ? 'es' : ''}
          </p>
        }
      />

      {/* Categoría principal */}
      <StatCard
        title="Categoría principal"
        value={topCategory.name}
        colorScheme="purple"
        icon={ShoppingCart}
        subtitle={
          <p className="text-lg font-bold text-purple-900 dark:text-gray-100">
            {formatMoney(topCategory.total)}
          </p>
        }
      />

      {/* Total de gastos */}
      <StatCard
        title="Total de gastos"
        value={totalExpenses.toString()}
        colorScheme="orange"
        icon={CreditCard}
        subtitle={
          <p className="text-sm text-orange-600 dark:text-gray-400">
            {currentMonthCount} este mes
          </p>
        }
      />

      {/* Ahorro del mes - solo mostrar si hay presupuesto */}
      {hasBudget && (
        <StatCard
          title={isOverBudget ? "Exceso de gasto" : "Ahorro del mes"}
          value={formatMoney(Math.abs(savings))}
          colorScheme={isOverBudget ? "red" : "teal"}
          icon={PiggyBank}
          subtitle={
            <div className="space-y-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Presupuesto: {formatMoney(budgetTotal || 0)}
              </p>
              {isOverBudget ? (
                <p className="text-xs text-red-500 dark:text-red-400">
                  Sobre presupuesto
                </p>
              ) : (
                <p className="text-xs text-teal-600 dark:text-teal-400">
                  {budgetTotal && budgetTotal > 0
                    ? `${((savings / budgetTotal) * 100).toFixed(1)}% ahorrado`
                    : ''}
                </p>
              )}
            </div>
          }
        />
      )}
    </div>
  )
}
