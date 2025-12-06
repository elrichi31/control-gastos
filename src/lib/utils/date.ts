import { format } from "date-fns"
import { es } from "date-fns/locale"

/**
 * Convierte una cadena de fecha en formato "YYYY-MM-DD" a un objeto Date local
 * Evita problemas de zona horaria manteniendo la fecha local
 */
export function toLocalDateFromString(dateStr: string): Date {
  // Extraer solo la parte de fecha si viene con timestamp
  const dateOnly = dateStr.slice(0, 10)
  const [year, month, day] = dateOnly.split("-").map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Convierte una cadena de fecha a Date con hora específica para comparaciones
 * Útil para filtros de rango de fechas
 */
export function toDateWithTime(dateStr: string, time: 'start' | 'end' = 'start'): Date {
  const timeStr = time === 'start' ? 'T00:00:00' : 'T23:59:59'
  return new Date(dateStr + timeStr)
}

/**
 * Formatea el título de grupos de gastos según el tipo de agrupación
 */
export function formatGroupTitle(key: string, groupBy: "dia" | "semana" | "mes"): string {
  if (groupBy === "dia") {
    const date = toLocalDateFromString(key)
    return format(date, "EEEE d 'de' MMMM yyyy", { locale: es })
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
    return format(date, "MMMM yyyy", { locale: es })
  }

  return key
}

/**
 * Convierte una fecha para mostrar en la UI
 */
export function formatDisplayDate(dateStr: string): string {
  return toLocalDateFromString(dateStr).toLocaleDateString("es-ES")
}

/**
 * Convierte una fecha para formateo con date-fns manteniendo zona horaria local
 */
export function formatDateWithLocale(dateStr: string, formatStr: string): string {
  return format(toDateWithTime(dateStr), formatStr, { locale: es })
}
