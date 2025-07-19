import { useEffect, useState } from "react"

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
        const res = await fetch("/api/gastos")
        if (!res.ok) throw new Error("Error al obtener gastos")
        const data = await res.json()
        
        // Formatear los datos para incluir metodo_pago si no existe
        const formattedData = data.map((gasto: any) => ({
          ...gasto,
          metodo_pago: gasto.metodo_pago || { id: 1, nombre: "Efectivo" }
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
      const res = await fetch(`/api/delete-gasto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: parseInt(id) }),
      })

      if (!res.ok) throw new Error("Error al eliminar gasto")

      // Actualizar el estado local
      setGastos(prev => prev.filter(gasto => gasto.id.toString() !== id))
    } catch (error) {
      console.error("Error al eliminar gasto:", error)
      throw error
    }
  }

  return { gastos, loading, error, deleteGasto }
}
