"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, DollarSign } from "lucide-react"
import Link from "next/link"
import { formatDateWithLocale, formatMoney } from "@/lib/utils"
import { Gasto } from "@/types"

interface RecentExpensesProps {
  expenses: Gasto[]
  totalCount: number
}

export function RecentExpenses({ expenses, totalCount }: RecentExpensesProps) {
  return (
    <Card className="dark:bg-neutral-900 dark:border-neutral-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Clock className="w-5 h-5" />
          Gastos Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No hay gastos registrados</p>
            <Link href="/form">
              <Button variant="outline" className="mt-4">
                Agregar tu primer gasto
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((gasto) => (
              <div key={gasto.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg border dark:border-neutral-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-neutral-700 rounded-full">
                    <DollarSign className="w-4 h-4 text-blue-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                      {gasto.descripcion}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {gasto.categoria.nombre} • {formatDateWithLocale(gasto.fecha, "d MMM")}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {formatMoney(gasto.monto)}
                </span>
              </div>
            ))}
            {totalCount > 6 && (
              <div className="text-center pt-4">
                <Link href="/estadisticas">
                  <Button variant="outline">
                    Ver todos los gastos
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
