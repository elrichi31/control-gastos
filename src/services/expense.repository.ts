import { CreateExpenseInput, UpdateExpenseInput, Expense, ExpenseFilters } from "../entities/expense"

// Repositorio para manejo de gastos
export class ExpenseRepository {
  private baseUrl = "/api/gastos"

  async list(filters?: ExpenseFilters): Promise<Expense[]> {
    const params = new URLSearchParams()
    
    if (filters?.from) params.append('from', filters.from)
    if (filters?.to) params.append('to', filters.to)
    if (filters?.categoria_id) params.append('categoria_id', filters.categoria_id.toString())
    if (filters?.metodo_pago_id) params.append('metodo_pago_id', filters.metodo_pago_id.toString())

    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl
    
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Error al obtener gastos: ${res.statusText}`)
    }
    
    return res.json()
  }

  async create(data: CreateExpenseInput): Promise<Expense> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || "Error al crear gasto")
    }

    return res.json()
  }

  async update(data: UpdateExpenseInput): Promise<Expense> {
    const res = await fetch(`${this.baseUrl}/${data.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || "Error al actualizar gasto")
    }

    return res.json()
  }

  async delete(id: string | number): Promise<void> {
    const res = await fetch(`${this.baseUrl}?id=${id}`, {
      method: "DELETE",
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || "Error al eliminar gasto")
    }
  }

  async getById(id: string | number): Promise<Expense | null> {
    const res = await fetch(`${this.baseUrl}/${id}`)
    
    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error(`Error al obtener gasto: ${res.statusText}`)
    }

    return res.json()
  }
}

// Instancia singleton del repositorio
export const expenseRepository = new ExpenseRepository()
