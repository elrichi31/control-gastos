"use client"

import { Trash2, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Income } from "../../types/budget"

interface IncomeListProps {
  incomes: Income[]
  onDeleteIncome: (income: Income) => void
  formatCurrency: (amount: number) => string
}

export function IncomeList({ incomes, onDeleteIncome, formatCurrency }: IncomeListProps) {
  return (
    <>
      <Separator />
      <div className="space-y-2">
        {incomes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No hay ingresos registrados en este mes</p>
        ) : (
          incomes.map((income) => (
            <div key={income.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{income.description}</p>
                  {income.isRecurring && (
                    <Badge variant="secondary" className="text-xs">
                      <Repeat className="h-3 w-3 mr-1" />
                      {income.originalId ? "Auto" : "Recurrente"}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-green-600 font-semibold">{formatCurrency(income.amount)}</p>
                  <span className="text-xs text-gray-500">{format(income.date, "dd MMM yyyy", { locale: es })}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteIncome(income)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </>
  )
}
