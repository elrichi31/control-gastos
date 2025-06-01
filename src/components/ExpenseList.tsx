import { ExpenseItem } from "./ExpenseItem"
import { Expense } from "./../hooks/useExpenses"
import { format, parse, parseISO } from "date-fns"
import { es } from "date-fns/locale"

type Props = {
  groupedExpenses: Record<string, Expense[]>
  isLoading: boolean
  onDelete: (id: string) => void
  groupBy: "dia" | "semana" | "mes"
}

function formatGroupTitle(key: string, groupBy: "dia" | "semana" | "mes"): string {
  try {
    if (groupBy === "mes") {
      const date = parse(key, "yyyy-MM", new Date())
      return format(date, "MMMM yyyy", { locale: es }) // ej: "mayo 2025"
    }

    if (groupBy === "semana") {
      const [from, to] = key.split("::")
      if (!from || !to) return key

      const fromDate = parseISO(from)
      const toDate = parseISO(to)

      const desde = format(fromDate, "EEEE d 'de' MMMM", { locale: es })
      const hasta = format(toDate, "EEEE d 'de' MMMM yyyy", { locale: es })

      return `Semana del ${desde} al ${hasta}`
    }

    if (groupBy === "dia") {
      const date = parseISO(key)
      return format(date, "EEEE d 'de' MMMM yyyy", { locale: es }) // ej: "lunes 2 de junio 2025"
    }
  } catch (error) {
    console.error("Error formateando título de grupo:", error)
    return key
  }

  return key
}


export function ExpenseList({ groupedExpenses, isLoading, onDelete, groupBy }: Props) {
  if (isLoading) {
    return <p className="text-center text-gray-500 py-8">Cargando gastos...</p>
  }

  if (!groupedExpenses || Object.keys(groupedExpenses).length === 0) {
    return <p className="text-center text-gray-500 py-8">No hay gastos registrados aún</p>
  }

  const groupKeys = Object.keys(groupedExpenses).sort((a, b) => {
    const extractDate = (key: string) => {
      if (groupBy === "semana") return parseISO(key.split("::")[0]) // usar el lunes
      if (groupBy === "mes") return parse(key, "yyyy-MM", new Date())
      return parseISO(key) // para "dia"
    }

    return extractDate(b).getTime() - extractDate(a).getTime() // más reciente primero
  })

  return (
    <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
      {groupKeys.map((groupTitle) => (
        <div key={groupTitle}>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            {formatGroupTitle(groupTitle, groupBy)}
          </h3>
          <div className="space-y-2">
            {groupedExpenses[groupTitle].map((expense) => (
              <ExpenseItem key={expense.id} expense={expense} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
