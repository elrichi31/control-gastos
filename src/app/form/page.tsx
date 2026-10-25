"use client"
import { Receipt, Repeat2 } from "lucide-react"
import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGastosFiltrados, Gasto } from "@/hooks/useGastosFiltrados"
import { ExpenseForm } from "@/components/gastos/ExpenseForm"
import dynamic from "next/dynamic"
const RecurringExpenseForm = dynamic(() => import("@/components/gastos-recurrentes/RecurringExpenseForm").then(m => m.RecurringExpenseForm), { loading: () => <p role="status">Cargando formulario…</p> })
import { ExpenseSummary } from "@/components/gastos/ExpenseSummary"
import { ExpenseDraftSummary, type ExpenseDraft } from "@/components/gastos/ExpenseDraftSummary"
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

  const [tab, setTab] = useState(tabInicial)
  const [draft, setDraft] = useState<ExpenseDraft | null>(null)
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
      throw error
    }
  }

  const fetchExpenses = refreshExpenses

  return (
    <PageShell className="max-w-6xl">
      <PageTitle customTitle="Nuevo Gasto - BethaSpend" />

      <PageHeader title="Nuevo gasto" description="Registra un gasto para que cuente en tu presupuesto del mes." />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <Card className="min-w-0 overflow-hidden shadow-sm">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-7">
            <TabsList aria-label="Tipo de gasto" className="h-auto gap-1 p-1">
              <TabsTrigger value="normal" className="min-h-10 gap-2 px-4"><Receipt aria-hidden="true" className="size-4" />Una vez</TabsTrigger>
              <TabsTrigger value="recurrente" className="min-h-10 gap-2 px-4"><Repeat2 aria-hidden="true" className="size-4" />Recurrente</TabsTrigger>
            </TabsList>
            <span className="hidden text-xs text-muted-foreground sm:block">Los campos con * son obligatorios</span>
          </div>
          <CardContent className="px-4 py-5 sm:px-7 sm:py-6">
            <TabsContent value="normal" className="mt-0">
              <ExpenseForm fetchExpenses={fetchExpenses} history={gastos} expenses={gastos} onDraftChange={setDraft} />
            </TabsContent>
            <TabsContent value="recurrente" className="mt-0">
              <RecurringExpenseForm onSuccess={fetchExpenses} />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
      {tab === "normal" && (
        <aside aria-label="Resumen del gasto" className="min-w-0 xl:sticky xl:top-4">
          <ExpenseDraftSummary draft={draft} expenses={gastos} />
        </aside>
      )}
      </div>

      <section aria-labelledby="recent-expenses-heading" className="mt-8">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="recent-expenses-heading" className="text-base font-semibold tracking-tight">Tu actividad</h2>
          <span className="text-xs text-muted-foreground">Gastos recientes</span>
        </div>
        <div className="mb-4">
          <ExpenseSummary
            expenses={filteredExpensesAsExpense}
            onDateRangeChange={handleFilterChange}
            groupBy={groupBy}
            setGroupBy={setGroupBy}
          />
        </div>
        <Card className="overflow-hidden">
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
