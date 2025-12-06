"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney } from "@/lib/utils"

interface MonthlyComparisonProps {
  lastMonthTotal: number
  currentMonthTotal: number
  monthlyChange: number
}

export function MonthlyComparison({ lastMonthTotal, currentMonthTotal, monthlyChange }: MonthlyComparisonProps) {
  if (lastMonthTotal <= 0) return null

  return (
    <Card className="dark:bg-neutral-900 dark:border-neutral-700">
      <CardHeader>
        <CardTitle className="text-base dark:text-white">Comparación Mensual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Mes anterior</span>
            <span className="font-medium dark:text-gray-200">{formatMoney(lastMonthTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Este mes</span>
            <span className="font-medium dark:text-gray-200">{formatMoney(currentMonthTotal)}</span>
          </div>
          <hr className="dark:border-neutral-800" />
          <div className="flex justify-between">
            <span className="text-sm font-medium dark:text-gray-200">Diferencia</span>
            <span className={`font-bold ${monthlyChange >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {monthlyChange >= 0 ? '+' : ''}{formatMoney(monthlyChange)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
