"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, RepeatIcon } from "lucide-react"
import { useGastosFiltrados, Gasto } from "@/hooks/useGastosFiltrados"
import { ExpenseForm } from "./../../components/ExpenseForm"
import { RecurringExpenseForm } from "./../../components/RecurringExpenseForm"
import { ExpenseSummary } from "./../../components/ExpenseSummary"
import { ExpenseList } from "./../../components/ExpenseList"
import { groupExpenses } from "@/lib/utils"
import { Expense } from "@/types"
import { toDateWithTime } from "@/lib/utils"
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
    metodo_pago: gasto.metodo_pago || DEFAULT_METODO_PAGO,
    is_recurrent: gasto.is_recurrent // ✅ Preservar is_recurrent
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
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-md mx-auto lg:max-w-7xl p-4 lg:p-6 space-y-6">
        <PageTitle customTitle="Nuevo Gasto - BethaSpend" />
        
        {/* Header optimizado para móvil */}
        <div className="text-center py-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">💰 Nuevo Gasto</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm lg:text-base">Registra tu gasto de forma rápida y sencilla</p>
        </div>

        {/* Layout responsive: móvil (columna) / desktop (grid) */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start space-y-6 lg:space-y-0">
          {/* Formulario principal - Prioridad en móvil */}
          <div className="lg:order-1">
            <Card className="shadow-lg rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Registrar Gasto
                </CardTitle>
                <CardDescription className="text-sm">Completa la información del gasto</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="normal" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="normal" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Gasto Normal
                    </TabsTrigger>
                    <TabsTrigger value="recurrente" className="flex items-center gap-2">
                      <RepeatIcon className="h-4 w-4" />
                      Gasto Recurrente
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="normal">
                    <ExpenseForm fetchExpenses={fetchExpenses} />
                  </TabsContent>
                  
                  <TabsContent value="recurrente">
                    <RecurringExpenseForm onSuccess={fetchExpenses} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Resumen - Segundo en móvil */}
          <div className="lg:order-2">
            <ExpenseSummary
              expenses={filteredExpensesAsExpense}
              onDateRangeChange={handleFilterChange}
              groupBy={groupBy}
              setGroupBy={setGroupBy}
            />
          </div>

          {/* Lista de gastos - Último en móvil */}
          <div className="lg:order-3">
            <Card className="shadow-lg rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg lg:text-xl">📝 Gastos Recientes</CardTitle>
                <CardDescription className="text-sm">Últimos gastos agrupados por {groupBy}</CardDescription>
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
      </div>
    </div>
  )
}
