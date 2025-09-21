export interface MonthData {
  name: string
  value: string
  number: number
}

export const allMonths: MonthData[] = [
  { name: "Enero", value: "enero", number: 1 },
  { name: "Febrero", value: "febrero", number: 2 },
  { name: "Marzo", value: "marzo", number: 3 },
  { name: "Abril", value: "abril", number: 4 },
  { name: "Mayo", value: "mayo", number: 5 },
  { name: "Junio", value: "junio", number: 6 },
  { name: "Julio", value: "julio", number: 7 },
  { name: "Agosto", value: "agosto", number: 8 },
  { name: "Septiembre", value: "septiembre", number: 9 },
  { name: "Octubre", value: "octubre", number: 10 },
  { name: "Noviembre", value: "noviembre", number: 11 },
  { name: "Diciembre", value: "diciembre", number: 12 },
]

// Estructura que devuelve el backend
export interface PresupuestoBackend {
  id: number
  anio: number
  mes: number // 1-12
  total: number
  gastos_registrados: number
  tendencia: string | null
  estado: string // "En progreso", "Completado", etc
}

export function mapEstado(estado: string): "completed" | "in-progress" | "pending" {
  if (estado.toLowerCase().includes("complet")) return "completed"
  if (estado.toLowerCase().includes("progreso")) return "in-progress"
  return "pending"
}

export function mapTendencia(tendencia: string | null): "up" | "down" | "stable" {
  if (tendencia === "up" || tendencia === "UP") return "up"
  if (tendencia === "down" || tendencia === "DOWN") return "down"
  return "stable"
}