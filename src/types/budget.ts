export interface Income {
  id: string
  description: string
  amount: number
  date: Date
  isRecurring: boolean
  originalId?: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  isRecurring: boolean
  date: Date
  originalId?: string
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
