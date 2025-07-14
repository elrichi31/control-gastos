import { useState, useEffect } from "react"

export interface Expense {
  id: number
  descripcion: string
  monto: number
  fecha: string
  categoria: {
    id: number
    nombre: string
  }
  metodo_pago: {
    id: number
    nombre: string
  }
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/gastos")
      const data = await res.json()

      const formatted = data.map((e: any) => ({
        id: e.id,
        descripcion: e.descripcion,
        monto: parseFloat(e.monto),
        fecha: e.fecha,
        categoria: {
          id: e.categoria?.id,
          nombre: e.categoria?.nombre || "Sin categoría",
        },
        metodo_pago: {
          id: e.metodo_pago?.id,
          nombre: e.metodo_pago?.nombre || "Sin método",
        },
      }))

      setExpenses(formatted)
    } catch (err) {
      console.error("Error al obtener datos del backend", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  return {
    expenses,
    isLoading,
    setExpenses,
    fetchExpenses,
  }
}
