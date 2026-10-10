import { useEffect, useState, useCallback } from "react"
import { DEFAULT_METODO_PAGO } from "@/lib/constants"
import type { Gasto } from "@/types"
import { fetchExpenses, deleteExpense } from "@/services/expenses"

export type { Gasto } from "@/types"

export function useGastosFiltrados() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshExpenses = useCallback(async () => {
      setError(null)
      try {
        const data = await fetchExpenses()
        
        // Formatear los datos para incluir metodo_pago si no existe
        const formattedData = data.map((gasto: any) => ({
          ...gasto,
          metodo_pago: gasto.metodo_pago || DEFAULT_METODO_PAGO,
          is_recurrent: gasto.is_recurrent ?? false
        }))
        
        setGastos(formattedData)
      } catch (e: any) {
        setError(e.message || "Error de red")
      }
      setLoading(false)
  }, [])

  useEffect(() => { void refreshExpenses() }, [refreshExpenses])

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

  return { gastos, loading, error, deleteGasto, refreshExpenses }
}
