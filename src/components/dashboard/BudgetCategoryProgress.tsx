"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney } from "@/lib/utils"

interface CategoryProgress {
  id: number
  nombre: string
  icono: string
  gastado: number
  presupuestado: number
}

interface BudgetCategoryProgressProps {
  categories: CategoryProgress[]
}

export function BudgetCategoryProgress({ categories }: BudgetCategoryProgressProps) {
  // Filtrar categorías que tienen presupuesto asignado
  const validCategories = categories.filter(cat => cat.presupuestado > 0)

  if (validCategories.length === 0) {
    return null
  }

  return (
    <Card className="col-span-full bg-white dark:bg-neutral-900 border dark:border-neutral-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold dark:text-white">
          Progreso por Categoría
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {validCategories.map((category) => {
            const percentage = category.presupuestado > 0
              ? (category.gastado / category.presupuestado) * 100
              : 0
            const isOverBudget = percentage > 100

            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{category.icono}</span>
                    <span className="font-medium dark:text-gray-200">{category.nombre}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-semibold ${
                      isOverBudget
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {formatMoney(category.gastado)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 mx-1">/</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatMoney(category.presupuestado)}
                    </span>
                  </div>
                </div>
                <div className="relative w-full h-3 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOverBudget
                        ? 'bg-red-500 dark:bg-red-600'
                        : percentage >= 80
                        ? 'bg-orange-500 dark:bg-orange-600'
                        : 'bg-teal-500 dark:bg-teal-600'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                  {isOverBudget && (
                    <div
                      className="absolute top-0 h-full bg-red-700 dark:bg-red-800 opacity-50"
                      style={{
                        left: '100%',
                        width: `${Math.min((percentage - 100), 100)}%`
                      }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-xs">
                  <span className={`font-medium ${
                    isOverBudget
                      ? 'text-red-600 dark:text-red-400'
                      : percentage >= 80
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-teal-600 dark:text-teal-400'
                  }`}>
                    {percentage.toFixed(1)}%
                  </span>
                  {isOverBudget && (
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      Excedido por {formatMoney(category.gastado - category.presupuestado)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
