"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney } from "@/lib/utils"

interface DaySummaryProps {
  todayTotal: number
  todayCount: number
  yesterdayTotal: number
  hasYesterdayExpenses: boolean
}

export function DaySummary({ todayTotal, todayCount, yesterdayTotal, hasYesterdayExpenses }: DaySummaryProps) {
  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 border-indigo-200 dark:border-neutral-700">
      <CardHeader>
        <CardTitle className="text-base text-indigo-700 dark:text-gray-300">Resumen del Día</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-indigo-600 dark:text-gray-400">Gastos hoy</span>
            <span className="font-bold text-indigo-900 dark:text-gray-100">{formatMoney(todayTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-indigo-600 dark:text-gray-400">Transacciones</span>
            <span className="font-medium text-indigo-900 dark:text-gray-100">{todayCount}</span>
          </div>
          {hasYesterdayExpenses && (
            <>
              <hr className="border-indigo-200 dark:border-neutral-700" />
              <div className="flex justify-between">
                <span className="text-sm text-indigo-600 dark:text-gray-400">Ayer gastaste</span>
                <span className="font-medium text-indigo-900 dark:text-gray-100">
                  {formatMoney(yesterdayTotal)}
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
