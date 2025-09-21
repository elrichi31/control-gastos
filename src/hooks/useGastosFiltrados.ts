import { useEffect, useState } from "react"
import { DEFAULT_METODO_PAGO } from "@/lib/constants"
import { fetchExpenses, deleteExpense } from "@/services/expenses"

export interface Gasto {
  id: number
  descripcion: string
  monto: number
  fecha: string // "2025-07-15"
  categoria_id: number
  categoria: { id: number; nombre: string }
  metodo_pago?: { id: number; nombre: string }
}

export function useGastosFiltrados() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGastos() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchExpenses()
        
        // Formatear los datos para incluir metodo_pago si no existe
        const formattedData = data.map((gasto: any) => ({
          ...gasto,
          metodo_pago: gasto.metodo_pago || DEFAULT_METODO_PAGO
        }))
        
        setGastos(formattedData)
      } catch (e: any) {
        setError(e.message || "Error de red")
      }
      setLoading(false)
    }
    fetchGastos()
  }, [])

  const deleteGasto = async (id: string) => {
    try {
      await deleteExpense(id)

      // Actualizar el estado local
      setGastos(prev => prev.filter(gasto => gasto.id.toString() !== id))
    } catch (error) {
      console.error("Error al eliminar gasto:", error)
      throw error
    }
  }

  return { gastos, loading, error, deleteGasto }
}
