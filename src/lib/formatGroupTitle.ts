import { format } from "date-fns"
import { es } from "date-fns/locale"

function toLocalDateFromString(dateStr: string): Date {
  // dateStr: "yyyy-MM-dd"
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function formatGroupTitle(key: string, groupBy: "dia" | "semana" | "mes") {
  if (groupBy === "dia") {
    const date = toLocalDateFromString(key)
    return format(date, "EEEE d 'de' MMMM yyyy", { locale: es }) // lunes 2 de junio 2025
  }

  if (groupBy === "semana") {
    const [from, to] = key.split("::")
    const fromDate = toLocalDateFromString(from)
    const toDate = toLocalDateFromString(to)
    return `Semana del ${format(fromDate, "EEEE d 'de' MMMM", { locale: es })} al ${format(toDate, "EEEE d 'de' MMMM yyyy", { locale: es })}`
  }

  if (groupBy === "mes") {
    const [year, month] = key.split("-")
    const date = new Date(Number(year), Number(month) - 1)
    return format(date, "MMMM yyyy", { locale: es }) // Mayo 2025
  }

  return key
}
