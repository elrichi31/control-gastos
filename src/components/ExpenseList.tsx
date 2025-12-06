import { useState } from "react"
import { ExpenseItem } from "./ExpenseItem"
// import { Expense } from "./../hooks/useExpenses"
import { Gasto } from "./../hooks/useGastosFiltrados"
import { format, parse, parseISO, addMinutes } from "date-fns"
import { es } from "date-fns/locale"
type Props = {
  groupedExpenses: Record<string, Gasto[]>
  isLoading: boolean
  onDelete: (id: string) => void
  groupBy: "dia" | "semana" | "mes"
}


function toLocalDate(date: Date) {
  // Si la fecha tiene hora 00:00:00 y se interpreta en UTC, ajusta a local
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatGroupTitle(key: string, groupBy: "dia" | "semana" | "mes"): string {
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

export function ExpenseList({ groupedExpenses, isLoading, onDelete, groupBy }: Props) {
  console.log(groupedExpenses)

  const groupKeys = Object.keys(groupedExpenses).sort((a, b) => {
    const extractDate = (key: string) => {
      if (groupBy === "semana") return parseISO(key.split("::")[0])
      if (groupBy === "mes") return parse(key, "yyyy-MM", new Date())
      return parseISO(key)
    }

    return extractDate(b).getTime() - extractDate(a).getTime()
  })

  if (isLoading) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-8">Cargando gastos...</p>
  }

  if (!groupedExpenses || groupKeys.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-8">No hay gastos registrados aún</p>
  }

  return (
    <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
      {groupKeys.map((groupTitle) => (
        <div key={groupTitle}>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {formatGroupTitle(groupTitle, groupBy)}
          </h3>
          <div className="space-y-2">
            {groupedExpenses[groupTitle].map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                onDelete={onDelete}
                showDeleteIcon={true}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function setExpenses(arg0: (prev: any) => any) {
  throw new Error("Function not implemented.")
}

