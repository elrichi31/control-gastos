// Interfaces comunes y tipos compartidos para evitar duplicación

export interface BaseGasto {
  id: number
  descripcion: string
  monto: number
  fecha: string // Formato: "YYYY-MM-DD"
  categoria_id: number
  categoria: { id: number; nombre: string }
}

export interface Gasto extends BaseGasto {
  metodo_pago?: { id: number; nombre: string }
}

export interface GastoCompleto extends BaseGasto {
  metodo_pago_id: number
  metodo_pago: { id: number; nombre: string }
}

// Alias para retrocompatibilidad
export type Expense = GastoCompleto

export interface CategoriaGasto {
  categoria: string
  total: number
  gastos: Gasto[]
}

export interface FiltroFechas {
  from: string
  to: string
}

export type TipoAgrupacion = "dia" | "semana" | "mes"

export interface EstadoCarga {
  loading: boolean
  error: string | null
}

// Colores predefinidos para categorías
export const COLORES_CATEGORIA: Record<string, string> = {
  Alimentacion: "bg-green-100 text-green-800",
  Transporte: "bg-blue-100 text-blue-800", 
  Entretenimiento: "bg-purple-100 text-purple-800",
  Salud: "bg-red-100 text-red-800",
  Educación: "bg-yellow-100 text-yellow-800",
  Compras: "bg-pink-100 text-pink-800",
  Servicios: "bg-gray-100 text-gray-800",
  Otros: "bg-orange-100 text-orange-800",
}

// Métodos de pago predeterminados
export const METODOS_PAGO_DEFAULT = {
  EFECTIVO: { id: 1, nombre: "Efectivo" },
  TARJETA: { id: 2, nombre: "Tarjeta" },
  TRANSFERENCIA: { id: 3, nombre: "Transferencia" }
} as const
