"use client"

import { useMemo } from "react"

interface CategoryData {
  name: string
  value: number
  color: string
}

interface QuickAnalysisWidgetProps {
  filteredGastos: any[]
  totalExpenses: number
  monthlyAverage: number
  categoryData: CategoryData[]
}

export function QuickAnalysisWidget({ 
  filteredGastos, 
  totalExpenses, 
  monthlyAverage, 
  categoryData 
}: QuickAnalysisWidgetProps) {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const uniqueDays = useMemo(() => {
    return [...new Set(filteredGastos.map(g => g.fecha))].length
  }, [filteredGastos])

  const averagePerDay = useMemo(() => {
    return filteredGastos.length > 0 
      ? Math.round(totalExpenses / Math.max(uniqueDays, 1))
      : 0
  }, [totalExpenses, uniqueDays, filteredGastos.length])

  const dateRange = useMemo(() => {
    if (filteredGastos.length === 0) return "N/A"
    const days = filteredGastos.map(g => new Date(g.fecha).getDate())
    return `${Math.min(...days)} - ${Math.max(...days)}`
  }, [filteredGastos])

  const activityPercentage = useMemo(() => {
    return filteredGastos.length > 0 
      ? `${((uniqueDays / 31) * 100).toFixed(0)}%`
      : "0%"
  }, [uniqueDays, filteredGastos.length])

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
        Análisis Rápido
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rangos de Gastos */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg p-4 border border-gray-200 dark:border-neutral-600 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Gasto más alto</span>
            <span className="text-sm font-bold text-red-600 dark:text-red-400">
              {filteredGastos.length > 0 
                ? formatMoney(Math.max(...filteredGastos.map(g => g.monto)))
                : "$0.00"
              }
            </span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Gasto más bajo</span>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              {filteredGastos.length > 0 
                ? formatMoney(Math.min(...filteredGastos.map(g => g.monto)))
                : "$0.00"
              }
            </span>
          </div>
          <div className="border-t border-gray-100 dark:border-neutral-700 pt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Días con gastos</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {uniqueDays}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Promedio por día</span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {formatMoney(averagePerDay)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Top Categorías */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg p-4 border border-gray-200 dark:border-neutral-600 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-3">Top 3 Categorías</div>
          {categoryData.slice(0, 3).map((category, index) => (
            <div key={category.name} className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: category.color }}
                ></div>
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate font-medium">
                  {category.name.length > 14 ? category.name.substring(0, 14) + '...' : category.name}
                </span>
              </div>
              <span className="text-sm font-bold dark:text-white">{formatMoney(category.value)}</span>
            </div>
          ))}
          {categoryData.length > 3 && (
            <div className="border-t border-gray-100 dark:border-neutral-700 pt-3 mt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Otras categorías</span>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                  {categoryData.length - 3}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total restante</span>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                  {formatMoney(categoryData.slice(3).reduce((sum, cat) => sum + cat.value, 0))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Comparación Mensual */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg p-4 border border-gray-200 dark:border-neutral-600 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-3">Comparación Mensual</div>
          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Este período</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {formatMoney(totalExpenses)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Promedio general</span>
              <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                {formatMoney(monthlyAverage)}
              </span>
            </div>
            {totalExpenses > 0 && monthlyAverage > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-neutral-700">
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Diferencia</span>
                <span className={`text-sm font-bold ${
                  totalExpenses > monthlyAverage ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {totalExpenses > monthlyAverage ? '+' : ''}
                  {((totalExpenses - monthlyAverage) / monthlyAverage * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="border-t border-gray-100 dark:border-neutral-700 pt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Rango de fechas</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {dateRange}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Actividad</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {activityPercentage}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
