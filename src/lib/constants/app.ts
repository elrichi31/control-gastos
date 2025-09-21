// Constantes globales de la aplicación

export const DEFAULT_METODO_PAGO = { id: 1, nombre: "Efectivo" }

export const METODOS_PAGO = {
  EFECTIVO: { id: 1, nombre: "Efectivo" },
  TARJETA: { id: 2, nombre: "Tarjeta" },
  TRANSFERENCIA: { id: 3, nombre: "Transferencia" }
} as const

export const MESES_NOMBRES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
] as const

export const MESES_NOMBRES_LOWERCASE = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio", 
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
] as const

export const TIPOS_FILTRO = {
  YEAR_MONTH: "year-month",
  YEAR: "year", 
  MONTH: "month",
  CUSTOM: "custom"
} as const

export const AGRUPACIONES = {
  DIA: "dia",
  SEMANA: "semana", 
  MES: "mes"
} as const

export const API_ENDPOINTS = {
  GASTOS: "/api/gastos",
  CATEGORIAS: "/api/categorias",
  METODOS_PAGO: "/api/metodos_pago",
  PRESUPUESTOS: "/api/presupuestos"
} as const

export const categories = [
  "Alimentación",
  "Transporte",
  "Entretenimiento",
  "Salud",
  "Educación",
  "Compras",
  "Servicios",
  "Otros",
]

export const COLORES_CATEGORIA = {
  Alimentación: "bg-green-100 text-green-800",
  Transporte: "bg-blue-100 text-blue-800",
  Entretenimiento: "bg-purple-100 text-purple-800", 
  Salud: "bg-red-100 text-red-800",
  Educación: "bg-yellow-100 text-yellow-800",
  Compras: "bg-pink-100 text-pink-800",
  Servicios: "bg-gray-100 text-gray-800",
  Otros: "bg-orange-100 text-orange-800"
} as const

export const paymentMethods = [
  "Efectivo",
  "Tarjeta de débito",
  "Tarjeta de crédito",
  "Transferencia",
  "Otro",
]

export const categoryIcons: { [key: string]: string } = {
  Alimentación: "🍽️",
  Transporte: "🚗",
  Entretenimiento: "🎬",
  Salud: "🏥",
  Educación: "📚",
  Compras: "🛍️",
  Servicios: "⚡",
  Otros: "📦",
}