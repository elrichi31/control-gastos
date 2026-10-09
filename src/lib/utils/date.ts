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
