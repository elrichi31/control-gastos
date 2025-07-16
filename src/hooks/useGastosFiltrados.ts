import { useEffect, useState } from "react"

export interface Gasto {
  id: number
  descripcion: string
  monto: number
  fecha: string // "2025-07-15"
  categoria_id: number
  categoria: { id: number; nombre: string }
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
        setGastos(data)
      } catch (e: any) {
        setError(e.message || "Error de red")
      }
      setLoading(false)
    }
    fetchGastos()
  }, [])

  return { gastos, loading, error }
}
