"use client"
import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

function ExpenseTracker() {
  const { gastos, loading, deleteGasto } = useGastosFiltrados()
  // /form?tipo=recurrente abre directo la pestaña de recurrentes
  const searchParams = useSearchParams()
  const tabInicial = searchParams.get("tipo") === "recurrente" ? "recurrente" : "normal"

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
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageTitle customTitle="Nuevo Gasto - BethaSpend" />

      {/* Encabezado alineado a la izquierda, al estilo de una página de Notion */}
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Nuevo gasto</h1>
        <p className="text-muted-foreground mt-1">Registra tu gasto de forma rápida y sencilla.</p>
      </header>

      {/* Columna principal + riel lateral: el formulario manda, lo demás acompaña */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Registrar gasto</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={tabInicial} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-5">
                  <TabsTrigger value="normal">Normal</TabsTrigger>
                  <TabsTrigger value="recurrente">Recurrente</TabsTrigger>
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

        <aside className="lg:col-span-5 space-y-6">
          <ExpenseSummary
            expenses={filteredExpensesAsExpense}
            onDateRangeChange={handleFilterChange}
            groupBy={groupBy}
            setGroupBy={setGroupBy}
          />

          <Card>
            {/* px-5 para alinear con el padding de las filas de ExpenseItem */}
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-base font-semibold">Gastos recientes</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <ExpenseList
                groupedExpenses={groupedExpenses}
                isLoading={loading}
                onDelete={handleDeleteExpense}
                groupBy={groupBy}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

export default function FormPage() {
  return (
    <Suspense fallback={null}>
      <ExpenseTracker />
    </Suspense>
  )
}
