// Tipos para gastos recurrentes

export type Frecuencia = 'semanal' | 'mensual' | 'anual'
export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
/** Yearly cost of a rule: weekly x 52, monthly x 12, yearly x 1. */
export const costoAnual = (r: { frecuencia: Frecuencia; monto: number }) =>
  Number(r.monto) * (r.frecuencia === 'semanal' ? 52 : r.frecuencia === 'mensual' ? 12 : 1)
export type EstadoInstancia = 'pendiente' | 'generado' | 'omitido'

export interface GastoRecurrente {
  id: number
  user_id: string
  descripcion: string
  monto: number
  categoria_id: number
  metodo_pago_id: number
  frecuencia: Frecuencia
  dia_semana?: number // 1=Lunes, 7=Domingo
  dia_mes?: number // 1-31; 29-31 fall on the last day of shorter months
  mes_anual?: number | null // 1-12, only for 'anual'
  fecha_inicio: string // "YYYY-MM-DD"
  fecha_fin?: string | null // "YYYY-MM-DD" o null
  activo: boolean
  created_at?: string
  updated_at?: string
}

export interface GastoRecurrenteInstancia {
  id: number
  gasto_recurrente_id: number
  gasto_id?: number | null
  fecha_programada: string // "YYYY-MM-DD"
  estado: EstadoInstancia
  generado_en?: string | null
  created_at?: string
}

export interface CreateGastoRecurrenteInput {
  descripcion: string
  monto: number
  categoria_id: number
  metodo_pago_id: number
  frecuencia: Frecuencia
  dia_semana?: number
  dia_mes?: number
  mes_anual?: number | null
  fecha_inicio: string
  fecha_fin?: string | null
  activo?: boolean
}
