"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign } from "lucide-react"
import { useGastosFiltrados, Gasto } from "@/hooks/useGastosFiltrados"
import { ExpenseForm } from "./../../components/ExpenseForm"
import { ExpenseSummary } from "./../../components/ExpenseSummary"
import { ExpenseList } from "./../../components/ExpenseList"
import { groupExpenses } from "@/lib/groupExpenses"
import { Expense } from "@/types"
import { toDateWithTime } from "@/lib/dateUtils"
import { DEFAULT_METODO_PAGO } from "@/lib/constants"
import { PageTitle } from "@/components/PageTitle"

// Helper function to convert Gasto to Expense
function gastoToExpense(gasto: Gasto): Expense {
  return {
    id: gasto.id,
    descripcion: gasto.descripcion,
    monto: gasto.monto,
    fecha: gasto.fecha,
    categoria_id: gasto.categoria_id,
    metodo_pago_id: gasto.metodo_pago?.id || 1,
    categoria: gasto.categoria,
    metodo_pago: gasto.metodo_pago || DEFAULT_METODO_PAGO
  }
}

export default function ExpenseTracker() {
  const { gastos, loading, deleteGasto } = useGastosFiltrados()

  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" })
  const [groupBy, setGroupBy] = useState<"dia" | "semana" | "mes">("dia")

  const handleFilterChange = (
    range: { from: string; to: string },
    group: "dia" | "semana" | "mes"
  ) => {
    setDateRange(range)
    setGroupBy(group)
  }

  const filteredExpenses = gastos.filter((expense) => {
    if (!dateRange.from && !dateRange.to) return true

    const expenseDate = toDateWithTime(expense.fecha)
    const fromDate = dateRange.from ? toDateWithTime(dateRange.from) : null
    const toDate = dateRange.to ? toDateWithTime(dateRange.to, 'end') : null

    if (fromDate && toDate) return expenseDate >= fromDate && expenseDate <= toDate
    if (fromDate) return expenseDate >= fromDate
    if (toDate) return expenseDate <= toDate
    return true
  })

  // Convert Gasto to Expense for compatibility with groupExpenses
  const filteredExpensesAsExpense = filteredExpenses.map(gastoToExpense)
  const groupedExpenses = groupExpenses(filteredExpensesAsExpense, groupBy)

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteGasto(id)
    } catch (error) {
      console.error("Error al eliminar gasto:", error)
      alert("Ocurrió un error al eliminar el gasto")
    }
  }

  // Función para refrescar los datos (compatible con ExpenseForm)
  const fetchExpenses = () => {
    // Los datos se actualizan automáticamente con useGastosFiltrados
    window.location.reload()
  }


  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <PageTitle customTitle="Nuevo Gasto - Control de Gastos" />
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
            expenses={filteredExpensesAsExpense}
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
              isLoading={loading}
              onDelete={handleDeleteExpense}
              groupBy={groupBy}
            />

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
