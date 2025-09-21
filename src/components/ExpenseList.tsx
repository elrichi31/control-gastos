import { useState } from "react"
import { ExpenseItem } from "./ExpenseItem"
import { format, parse, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { ConfirmModal } from "./ConfirmModal"

// Tipos para compatibilidad
interface BaseExpense {
  id: string | number
  descripcion: string
  monto: number
  fecha: string
  categoria?: { nombre: string }
  metodo_pago?: { nombre: string }
}

type GroupByPeriod = "dia" | "semana" | "mes"

interface ExpenseListProps {
  // Props comunes
  expenses?: BaseExpense[]
  isLoading?: boolean
  onDelete: (id: string | number) => void
  
  // Para vista agrupada (feature y legacy)
  groupedExpenses?: Record<string, BaseExpense[]>
  groupBy?: GroupByPeriod
  showDeleteIcon?: boolean
  
  // Para vista con filtros (expense-details)
  showSummary?: boolean
  totalExpenses?: number
}

// Funciones auxiliares para grouping
function toLocalDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatGroupTitle(key: string, groupBy: GroupByPeriod): string {
  try {
    if (groupBy === "mes") {
      const date = toLocalDate(parse(key, "yyyy-MM", new Date()))
      return format(date, "MMMM yyyy", { locale: es })
    }

    if (groupBy === "semana") {
      const [from, to] = key.split("::")
      if (!from || !to) return key

      const fromDate = toLocalDate(parseISO(from))
      const toDate = toLocalDate(parseISO(to))

      const desde = format(fromDate, "EEEE d 'de' MMMM", { locale: es })
      const hasta = format(toDate, "EEEE d 'de' MMMM yyyy", { locale: es })

      return `Semana del ${desde} al ${hasta}`
    }

    if (groupBy === "dia") {
      const date = toLocalDate(parseISO(key))
      return format(date, "EEEE d 'de' MMMM yyyy", { locale: es })
    }
  } catch (error) {
    console.error("Error formateando título de grupo:", error)
    return key
  }

  return key
}

export function ExpenseList({
  expenses = [],
  groupedExpenses,
  isLoading = false,
  onDelete,
  groupBy = "dia",
  showDeleteIcon = false,
  showSummary = false,
  totalExpenses
}: ExpenseListProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | number | null>(null)

  // Manejar confirmación de eliminación
  const handleRequestDelete = (id: string | number) => {
    setSelectedId(id)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedId !== null) {
      onDelete(selectedId)
      setConfirmOpen(false)
      setSelectedId(null)
    }
  }

  // Loading state
  if (isLoading) {
    return <p className="text-center text-gray-500 py-8">Cargando gastos...</p>
  }

  // Vista agrupada (para features y legacy)
  if (groupedExpenses) {
    const groupKeys = Object.keys(groupedExpenses).sort((a, b) => {
      const extractDate = (key: string) => {
        if (groupBy === "semana") return parseISO(key.split("::")[0])
        if (groupBy === "mes") return parse(key, "yyyy-MM", new Date())
        return parseISO(key)
      }
      return extractDate(b).getTime() - extractDate(a).getTime()
    })

    if (groupKeys.length === 0) {
      return <p className="text-center text-gray-500 py-8">No hay gastos registrados aún</p>
    }

    return (
      <>
        <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
          {groupKeys.map((groupTitle) => (
            <div key={groupTitle}>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                {formatGroupTitle(groupTitle, groupBy)}
              </h3>
              <div className="space-y-2">
                {groupedExpenses[groupTitle].map((expense) => (
                  <ExpenseItem
                    key={expense.id}
                    expense={expense}
                    onDelete={handleRequestDelete}
                    showDeleteIcon={showDeleteIcon}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <ConfirmModal
          open={confirmOpen}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setConfirmOpen(false)
            setSelectedId(null)
          }}
        />
      </>
    )
  }

  // Vista simple con lista de gastos
  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg mb-2">No se encontraron gastos</p>
        <p className="text-sm">
          {showSummary ? "Intenta ajustar los filtros para ver más resultados" : "No hay gastos registrados aún"}
        </p>
      </div>
    )
  }

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.monto, 0)

  return (
    <>
      <div className="space-y-4">
        {/* Resumen opcional */}
        {showSummary && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  {expenses.length} gasto{expenses.length !== 1 ? 's' : ''} encontrado{expenses.length !== 1 ? 's' : ''}
                </p>
                {totalExpenses && (
                  <p className="text-xs text-blue-500">
                    de {totalExpenses} total{totalExpenses !== 1 ? 'es' : ''}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-900">
                  ${totalAmount.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600">Total filtrado</p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de gastos */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {expenses.map((expense) => (
            <ExpenseItem
              key={expense.id}
              expense={expense}
              onDelete={handleRequestDelete}
              showDeleteIcon={showDeleteIcon}
            />
          ))}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false)
          setSelectedId(null)
        }}
      />
    </>
  )
}
