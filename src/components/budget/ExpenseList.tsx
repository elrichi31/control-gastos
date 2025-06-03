"use client"

import { Trash2, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Expense } from "../../types/budget"

interface ExpenseListProps {
  expenses: Expense[]
  onDeleteExpense: (expense: Expense) => void
  formatCurrency: (amount: number) => string
}

export function ExpenseList({ expenses, onDeleteExpense, formatCurrency }: ExpenseListProps) {
  return (
    <>
      <Separator />
      <div className="space-y-2">
        {expenses.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No hay gastos registrados en este mes</p>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{expense.description}</p>
                  {expense.isRecurring && (
                    <Badge variant="secondary" className="text-xs">
                      <Repeat className="h-3 w-3 mr-1" />
                      {expense.originalId ? "Auto" : "Recurrente"}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-red-600 font-semibold">{formatCurrency(expense.amount)}</p>
                  <Badge variant="outline" className="text-xs">
                    {expense.category}
                  </Badge>
                  <span className="text-xs text-gray-500">{format(expense.date, "dd MMM yyyy", { locale: es })}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteExpense(expense)}
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
