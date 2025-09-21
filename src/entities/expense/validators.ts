import { CreateExpenseInput, UpdateExpenseInput } from "./types"

// Validaciones para gastos
export const validateExpense = (data: CreateExpenseInput): string[] => {
  const errors: string[] = []

  if (!data.descripcion?.trim()) {
    errors.push("La descripción es requerida")
  }

  if (!data.monto || data.monto <= 0) {
    errors.push("El monto debe ser mayor a 0")
  }

  if (!data.fecha) {
    errors.push("La fecha es requerida")
  }

  if (!data.categoria_id || data.categoria_id <= 0) {
    errors.push("La categoría es requerida")
  }

  if (!data.metodo_pago_id || data.metodo_pago_id <= 0) {
    errors.push("El método de pago es requerido")
  }

  return errors
}

export const validateUpdateExpense = (data: UpdateExpenseInput): string[] => {
  const errors: string[] = []

  if (!data.id || data.id <= 0) {
    errors.push("El ID del gasto es requerido")
  }

  if (data.descripcion !== undefined && !data.descripcion?.trim()) {
    errors.push("La descripción no puede estar vacía")
  }

  if (data.monto !== undefined && data.monto <= 0) {
    errors.push("El monto debe ser mayor a 0")
  }

  if (data.categoria_id !== undefined && data.categoria_id <= 0) {
    errors.push("La categoría debe ser válida")
  }

  if (data.metodo_pago_id !== undefined && data.metodo_pago_id <= 0) {
    errors.push("El método de pago debe ser válido")
  }

  return errors
}
