"use client"
import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGastosFiltrados, Gasto } from "@/hooks/useGastosFiltrados"
import { ExpenseForm } from "@/components/gastos/ExpenseForm"
import { RecurringExpenseForm } from "@/components/gastos-recurrentes/RecurringExpenseForm"
import { ExpenseSummary } from "@/components/gastos/ExpenseSummary"
import { ExpenseList } from "@/components/gastos/ExpenseList"
import { groupExpenses } from "@/lib/utils"
import { Expense } from "@/types"
import { toDateWithTime } from "@/lib/utils"
import { DEFAULT_METODO_PAGO } from "@/lib/constants"
import { PageShell, PageHeader } from "@/components/ui/page-layout"
import { PageTitle } from "@/components/layout/PageTitle"
import { Button } from "@/components/ui/button"

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
    is_recurrent: gasto.is_recurrent, // ✅ Preservar is_recurrent
    tags: gasto.tags,
    impuesto_exterior: gasto.impuesto_exterior
  }
}

function ExpenseTracker() {
  const { gastos, loading, error, deleteGasto, refreshExpenses } = useGastosFiltrados()
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

  const fetchExpenses = refreshExpenses

  return (
    <PageShell>
      <PageTitle customTitle="Nuevo Gasto - BethaSpend" />

      <PageHeader title="Nuevo gasto" description="Registra tu gasto de forma rápida y sencilla." />

      {/* Arriba: formulario + resumen al lado. Abajo: gastos recientes a todo el ancho. */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-start">
        <div className="min-w-0">
          <Card>
            <CardContent className="pt-5">
              <Tabs defaultValue={tabInicial} className="w-full">
                <TabsList className="mb-5">
                  <TabsTrigger value="normal">Normal</TabsTrigger>
                  <TabsTrigger value="recurrente">Recurrente</TabsTrigger>
                </TabsList>

                <TabsContent value="normal">
                  <ExpenseForm fetchExpenses={fetchExpenses} history={gastos} />
                </TabsContent>

                <TabsContent value="recurrente">
                  <RecurringExpenseForm onSuccess={fetchExpenses} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <aside aria-label="Resumen" className="min-w-0 xl:sticky xl:top-4">
          <ExpenseSummary
            expenses={filteredExpensesAsExpense}
            onDateRangeChange={handleFilterChange}
            groupBy={groupBy}
            setGroupBy={setGroupBy}
          />
        </aside>
      </div>

      <section aria-label="Gastos recientes" className="mt-6">
        <Card>
          <CardHeader className="px-5 pt-5 pb-3">
            <CardTitle className="text-base font-semibold">Gastos recientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {error && <div role="alert" className="px-5 py-3 space-y-2"><p className="text-sm text-destructive">No se pudo actualizar la lista de gastos.</p><Button variant="outline" size="sm" onClick={() => void refreshExpenses()}>Reintentar</Button></div>}
            <ExpenseList
              groupedExpenses={groupedExpenses}
              isLoading={loading}
              onDelete={handleDeleteExpense}
              onUpdated={refreshExpenses}
              groupBy={groupBy}
            />
          </CardContent>
        </Card>
      </section>
    </PageShell>
  )
}

export default function FormPage() {
  return (
    <Suspense fallback={null}>
      <ExpenseTracker />
    </Suspense>
  )
}
