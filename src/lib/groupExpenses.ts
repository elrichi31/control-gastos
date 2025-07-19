import { Expense } from "@/types"
import { endOfWeek, format } from "date-fns"
import { toLocalDateFromString } from "./dateUtils"

export function groupExpenses(expenses: Expense[], groupBy: "dia" | "semana" | "mes") {
  const grouped: Record<string, Expense[]> = {}

  for (const expense of expenses) {
    const date = toLocalDateFromString(expense.fecha)
    let key: string

    if (groupBy === "dia") {
      key = format(date, "yyyy-MM-dd")
    } else if (groupBy === "semana") {
      const monday = getStartOfWeek(date)
      const sunday = endOfWeek(monday, { weekStartsOn: 1 })
      key = `${format(monday, "yyyy-MM-dd")}::${format(sunday, "yyyy-MM-dd")}`
    } else if (groupBy === "mes") {
      key = format(date, "yyyy-MM")
    } else {
      key = format(date, "yyyy-MM-dd")
    }

    if (!grouped[key]) grouped[key] = []
    grouped[key].push(expense)
  }

  return grouped
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // lunes como inicio
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}
