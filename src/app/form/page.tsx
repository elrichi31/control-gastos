"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign } from "lucide-react"
import { useExpenses } from "./../../hooks/useExpenses"
import { ExpenseForm } from "./../../components/ExpenseForm"
import { ExpenseSummary } from "./../../components/ExpenseSummary"
import { ExpenseList } from "./../../components/ExpenseList"
import { groupExpenses } from "@/lib/groupExpenses"

export default function ExpenseTracker() {
  const { expenses, isLoading, setExpenses, fetchExpenses } = useExpenses()

  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" })
  const [groupBy, setGroupBy] = useState<"dia" | "semana" | "mes">("dia")

  const handleFilterChange = (
    range: { from: string; to: string },
    group: "dia" | "semana" | "mes"
  ) => {
    setDateRange(range)
    setGroupBy(group)
  }

  const filteredExpenses = expenses.filter((expense) => {
    if (!dateRange.from && !dateRange.to) return true

    const expenseDate = new Date(expense.fecha)
    const fromDate = dateRange.from ? new Date(dateRange.from) : null
    const toDate = dateRange.to ? new Date(dateRange.to) : null

    if (fromDate) fromDate.setUTCHours(0, 0, 0, 0)
    if (toDate) toDate.setUTCHours(23, 59, 59, 999)

    if (fromDate && toDate) return expenseDate >= fromDate && expenseDate <= toDate
    if (fromDate) return expenseDate >= fromDate
    if (toDate) return expenseDate <= toDate
    return true
  })

  const groupedExpenses = groupExpenses(filteredExpenses, groupBy)

  const deleteExpense = async (id: string) => {
    try {
      await fetch(`/api/gastos?id=${id}`, {
        method: "DELETE",
      })

      setExpenses((prev) => prev.filter((expense) => String(expense.id) !== String(id)))
    } catch (error) {
      console.error("Error al eliminar gasto:", error)
      alert("Ocurrió un error al eliminar el gasto")
    }
  }


  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Control de Gastos Personales</h1>
        <p className="text-gray-600 mt-2">Registra y controla tus gastos diarios</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Registrar Nuevo Gasto
            </CardTitle>
            <CardDescription>Completa la información del gasto que deseas registrar</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseForm fetchExpenses={fetchExpenses} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <ExpenseSummary
            expenses={filteredExpenses}
            onDateRangeChange={handleFilterChange}
            groupBy={groupBy}
            setGroupBy={setGroupBy}
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Gastos Recientes</CardTitle>
            <CardDescription>Últimos gastos agrupados por {groupBy}</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseList
              groupedExpenses={groupedExpenses}
              isLoading={isLoading}
              onDelete={deleteExpense}
              groupBy={groupBy}
            />

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
