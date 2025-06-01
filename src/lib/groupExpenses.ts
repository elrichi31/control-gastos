import { Expense } from "@/hooks/useExpenses"
import { addDays, endOfWeek, format } from "date-fns"

export function groupExpenses(expenses: Expense[], groupBy: "dia" | "semana" | "mes") {
  const grouped: Record<string, Expense[]> = {}

  for (const expense of expenses) {
    const date = new Date(expense.date)
    let key: string

    if (groupBy === "dia") {
      key = format(date, "yyyy-MM-dd") // para formato: lunes 2 de junio 2025
    } else if (groupBy === "semana") {
      const monday = getStartOfWeek(date)
      const sunday = endOfWeek(monday, { weekStartsOn: 1 }) // semana inicia en lunes
      key = `${format(monday, "yyyy-MM-dd")}::${format(sunday, "yyyy-MM-dd")}`
      // ejemplo: 2025-06-02::2025-06-08
    } else if (groupBy === "mes") {
      key = format(date, "yyyy-MM") // para formato: mayo 2025
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
