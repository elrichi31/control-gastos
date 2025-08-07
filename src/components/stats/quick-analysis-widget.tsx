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
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
        Análisis Rápido
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rangos de Gastos */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600 font-medium">Gasto más alto</span>
            <span className="text-sm font-bold text-red-600">
              {filteredGastos.length > 0 
                ? formatMoney(Math.max(...filteredGastos.map(g => g.monto)))
                : "$0.00"
              }
            </span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600 font-medium">Gasto más bajo</span>
            <span className="text-sm font-bold text-green-600">
              {filteredGastos.length > 0 
                ? formatMoney(Math.min(...filteredGastos.map(g => g.monto)))
                : "$0.00"
              }
            </span>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 font-medium">Días con gastos</span>
              <span className="text-sm font-bold text-blue-600">
                {uniqueDays}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Promedio por día</span>
              <span className="text-sm font-bold text-purple-600">
                {formatMoney(averagePerDay)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Top Categorías */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600 font-medium mb-3">Top 3 Categorías</div>
          {categoryData.slice(0, 3).map((category, index) => (
            <div key={category.name} className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: category.color }}
                ></div>
                <span className="text-sm text-gray-700 truncate font-medium">
                  {category.name.length > 14 ? category.name.substring(0, 14) + '...' : category.name}
                </span>
              </div>
              <span className="text-sm font-bold">{formatMoney(category.value)}</span>
            </div>
          ))}
          {categoryData.length > 3 && (
            <div className="border-t border-gray-100 pt-3 mt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 font-medium">Otras categorías</span>
                <span className="text-sm font-bold text-gray-500">
                  {categoryData.length - 3}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-medium">Total restante</span>
                <span className="text-sm font-bold text-gray-500">
                  {formatMoney(categoryData.slice(3).reduce((sum, cat) => sum + cat.value, 0))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Comparación Mensual */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600 font-medium mb-3">Comparación Mensual</div>
          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 font-medium">Este período</span>
              <span className="text-sm font-bold text-blue-600">
                {formatMoney(totalExpenses)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 font-medium">Promedio general</span>
              <span className="text-sm font-bold text-gray-600">
                {formatMoney(monthlyAverage)}
              </span>
            </div>
            {totalExpenses > 0 && monthlyAverage > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-700 font-medium">Diferencia</span>
                <span className={`text-sm font-bold ${
                  totalExpenses > monthlyAverage ? 'text-red-600' : 'text-green-600'
                }`}>
                  {totalExpenses > monthlyAverage ? '+' : ''}
                  {((totalExpenses - monthlyAverage) / monthlyAverage * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="border-t border-gray-100 pt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 font-medium">Rango de fechas</span>
              <span className="text-sm font-bold text-indigo-600">
                {dateRange}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Actividad</span>
              <span className="text-sm font-bold text-indigo-600">
                {activityPercentage}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
