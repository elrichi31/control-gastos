import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toLocalDateFromString } from "./date"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un monto como moneda USD
 */
const moneyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

export function formatMoney(amount: number): string {
  return moneyFormatter.format(amount)
}

/**
 * Formatea una fecha en formato legible en español
 * Usa toLocalDateFromString para evitar problemas de zona horaria
 */
export function formatDate(dateString: string): string {
  return format(toLocalDateFromString(dateString), "dd MMM yyyy", { locale: es })
}
