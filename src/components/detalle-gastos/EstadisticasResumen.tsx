"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingDown, Receipt, BarChart3, Tag } from 'lucide-react'

interface EstadisticasResumenProps {
  statistics: {
    total: number
    count: number
    average: number
    categoryStats: Array<{
      categoria: string
      total: number
      count: number
      percentage: number
    }>
  }
  formatMoney: (amount: number) => string
}

export function EstadisticasResumen({ statistics, formatMoney }: EstadisticasResumenProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="dark:bg-neutral-900 dark:border-neutral-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Gastado</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatMoney(statistics.total)}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-neutral-900 dark:border-neutral-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Número de Gastos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statistics.count}
              </p>
            </div>
            <Receipt className="w-8 h-8 text-blue-600 dark:text-gray-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-neutral-900 dark:border-neutral-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Promedio por Gasto</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatMoney(statistics.average)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-600 dark:text-emerald-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-neutral-900 dark:border-neutral-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Categorías</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statistics.categoryStats.length}
              </p>
            </div>
            <Tag className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
