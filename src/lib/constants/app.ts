// Constantes globales de la aplicación

export const DEFAULT_METODO_PAGO = { id: 1, nombre: "Efectivo" }

export const MESES_NOMBRES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
] as const

export const MESES_NOMBRES_LOWERCASE = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio", 
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
] as const

export const API_ENDPOINTS = {
  GASTOS: "/api/gastos",
  CATEGORIAS: "/api/categorias",
  METODOS_PAGO: "/api/metodos_pago",
  PRESUPUESTOS: "/api/presupuestos",
  GASTOS_RECURRENTES: "/api/gastos-recurrentes"
} as const

// Chips de categoria: tinte suave sobre la paleta de charts, legible en ambos
// temas. Las claves van normalizadas (sin acentos, minusculas) porque los
// nombres que llegan de la base no siempre traen tilde.
export const COLORES_CATEGORIA: Record<string, string> = {
  alimentacion:    "bg-chart-2/15 text-chart-2 border-chart-2/25",
  transporte:      "bg-chart-1/15 text-chart-1 border-chart-1/25",
  entretenimiento: "bg-chart-4/15 text-chart-4 border-chart-4/25",
  salud:           "bg-chart-5/15 text-chart-5 border-chart-5/25",
  educacion:       "bg-chart-3/15 text-chart-3 border-chart-3/25",
  compras:         "bg-chart-4/15 text-chart-4 border-chart-4/25",
  servicios:       "bg-chart-1/15 text-chart-1 border-chart-1/25",
  suscripciones:   "bg-chart-4/15 text-chart-4 border-chart-4/25",
  otros:           "bg-chart-3/15 text-chart-3 border-chart-3/25",
}

const NEUTRO_CATEGORIA = "bg-muted text-muted-foreground border-border"

/** Normaliza el nombre (quita acentos y pasa a minusculas) antes de buscar. */
export function getCategoriaColor(nombre?: string | null): string {
  if (!nombre) return NEUTRO_CATEGORIA
  const key = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
  return COLORES_CATEGORIA[key] ?? NEUTRO_CATEGORIA
}
