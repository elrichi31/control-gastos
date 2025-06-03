"use client"

import { Repeat } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Income, Expense } from "../../types/budget"
import { categories } from "../../types/budget"

interface BudgetAnalysisProps {
  incomes: Income[]
  expenses: Expense[]
  selectedMonth: Date
  balance: number
  formatCurrency: (amount: number) => string
}

export function BudgetAnalysis({ incomes, expenses, selectedMonth, balance, formatCurrency }: BudgetAnalysisProps) {
  if (incomes.length === 0 && expenses.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis del Presupuesto</CardTitle>
        <CardDescription>
          Resumen de tu situación financiera para {format(selectedMonth, "MMMM yyyy", { locale: es })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-700">Ingresos por fuente:</h4>
              {incomes.map((income) => (
                <div key={income.id} className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    {income.description}
                    {income.isRecurring && <Repeat className="h-3 w-3 text-gray-400" />}
                  </span>
                  <span className="font-medium">{formatCurrency(income.amount)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-red-700">Gastos por categoría:</h4>
              {categories.map((category) => {
                const categoryTotal = expenses
                  .filter((expense) => expense.category === category)
                  .reduce((sum, expense) => sum + expense.amount, 0)

                if (categoryTotal > 0) {
                  return (
                    <div key={category} className="flex justify-between text-sm">
                      <span>{category}</span>
                      <span className="font-medium">{formatCurrency(categoryTotal)}</span>
                    </div>
                  )
                }
                return null
              })}
            </div>
          </div>

          <Separator />

          <div className="text-center">
            <p className="text-lg">
              {balance >= 0 ? (
                <span className="text-green-600">
                  ¡Excelente! Te sobran <strong>{formatCurrency(balance)}</strong> este mes
                </span>
              ) : (
                <span className="text-red-600">
                  Atención: Te faltan <strong>{formatCurrency(Math.abs(balance))}</strong> para cubrir tus gastos
                </span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
