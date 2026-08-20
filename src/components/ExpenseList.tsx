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
    return <p className="text-center text-sm text-muted-foreground px-5 py-10">Cargando gastos...</p>
  }

  if (!groupedExpenses || groupKeys.length === 0) {
    return <p className="text-center text-sm text-muted-foreground px-5 py-10">No hay gastos registrados aún</p>
  }

  return (
    <div className="max-h-[26rem] overflow-y-auto overflow-x-hidden">
      {groupKeys.map((groupTitle) => (
        <div key={groupTitle} className="mb-4 last:mb-0">
          <h3 className="sticky top-0 z-10 bg-card px-5 pt-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {formatGroupTitle(groupTitle, groupBy)}
          </h3>
          <div>
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

