import type { StoredForeignTax } from '@/lib/foreign-tax'
// Interfaces comunes y tipos compartidos para evitar duplicación

export interface BaseGasto {
  id: number
  descripcion: string
  monto: number
  fecha: string // Formato: "YYYY-MM-DD"
  categoria_id: number
  categoria: { id: number; nombre: string }
  is_recurrent?: boolean
  tags?: string[]
  impuesto_exterior?: StoredForeignTax | null
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
