import { useMemo } from "react"
import { DEFAULT_METODO_PAGO } from "@/lib/constants"
import type { Gasto } from "@/types"
import { deleteExpense } from "@/services/expenses"
import { useExpensesStore } from "@/hooks/useExpensesStore"

export type { Gasto } from "@/types"

export function useGastosFiltrados() {
  const { gastos: stored, loading, error, refresh } = useExpensesStore()

  // Formatear los datos para incluir metodo_pago si no existe
  const gastos = useMemo<Gasto[]>(() => stored.map(gasto => ({
    ...gasto,
    metodo_pago: gasto.metodo_pago || DEFAULT_METODO_PAGO,
    is_recurrent: gasto.is_recurrent ?? false
  })), [stored])

  const deleteGasto = async (id: string) => {
    try {
      await deleteExpense(id)
      await refresh()
    } catch (error) {
      console.error("Error al eliminar gasto:", error)
      throw error
    }
  }

  return { gastos, loading, error, deleteGasto, refreshExpenses: refresh }
}
