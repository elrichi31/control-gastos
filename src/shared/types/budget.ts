export type Expense = {
  id: number
  descripcion: string
  monto: number
  fecha: string
  categoria_id: number
  metodo_pago_id: number
  categoria: { id: number; nombre: string }
  metodo_pago: { id: number; nombre: string }
}


export const categories = [
  "Alimentación",
  "Transporte",
  "Entretenimiento",
  "Servicios",
  "Suscripciones",
  "Salud",
  "Educación",
  "Otros",
]

export interface PresupuestoCategoriaDetalle {
  id: number
  categoria_id: number
  total_categoria: number
  cantidad_gastos: number
  categoria: { nombre: string }
  movimientos: MovimientoPresupuesto[]
}

export interface CategoriaDB {
  id: number;
  nombre: string;
  icono?: string;
  color?: string;
}

export interface MetodoPagoDB {
  id: number;
  nombre: string;
}

export interface MovimientoPresupuesto {
  id: number
  descripcion: string
  monto: number
  fecha: string
  metodo_pago_id: number
}
