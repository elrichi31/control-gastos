"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, ArrowUpIcon, ArrowDownIcon } from "lucide-react"

interface CategoryComparisonProps {
  categoryComparisonStats: Array<{
    categoria: string
    current: number
    previous: number
    change: number
    trend: 'increase' | 'decrease' | 'stable'
  }>
}

export function CategoryComparison({ categoryComparisonStats }: CategoryComparisonProps) {
  if (!categoryComparisonStats || categoryComparisonStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Comparación por Categorías
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No hay datos para comparar</p>
        </CardContent>
      </Card>
    )
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increase':
        return <ArrowUpIcon className="h-4 w-4 text-red-500" />
      case 'decrease':
        return <ArrowDownIcon className="h-4 w-4 text-green-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increase':
        return 'text-red-600 bg-red-50'
      case 'decrease':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  // Mostrar solo las 6 categorías con mayor cambio
  const topChanges = categoryComparisonStats.slice(0, 6)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Comparación vs Mes Anterior
        </CardTitle>
        <p className="text-sm text-gray-600">
          Cambios por categoría respecto al mes anterior
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topChanges.map((item, index) => (
            <div key={item.categoria} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {getTrendIcon(item.trend)}
                  <span className="font-medium">{item.categoria}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <div className="font-semibold">${item.current.toLocaleString()}</div>
                  <div className="text-gray-500">
                    Anterior: ${item.previous.toLocaleString()}
                  </div>
                </div>
                
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(item.trend)}`}>
                  {item.change > 0 ? '+' : ''}{item.change}%
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {categoryComparisonStats.length > 6 && (
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-gray-500">
              Mostrando las 6 categorías con mayor variación
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
