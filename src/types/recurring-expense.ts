// Tipos para gastos recurrentes

export type Frecuencia = 'semanal' | 'mensual'
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
  dia_mes?: number // 1-31
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
  fecha_inicio: string
  fecha_fin?: string | null
  activo?: boolean
}
