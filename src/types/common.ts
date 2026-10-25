import type { StoredForeignTax } from '@/lib/foreign-tax'
// Interfaces comunes y tipos compartidos para evitar duplicación

export interface Gasto {
  id: number
  descripcion: string
  monto: number
  fecha: string // Formato: "YYYY-MM-DD"
  categoria_id: number
  metodo_pago_id?: number
  categoria: { id: number; nombre: string }
  metodo_pago?: { id: number; nombre: string } | null
  is_recurrent?: boolean
  tags?: string[]
  impuesto_exterior?: StoredForeignTax | null
}

// Alias temporal; el nombre se unifica en HU-8
export type Expense = Gasto
