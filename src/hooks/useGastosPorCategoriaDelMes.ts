import { useEffect, useState } from "react"
import { fetchExpenses } from "@/services/expenses"

interface Gasto {
  id: number
  descripcion: string
  monto: number
  fecha: string // "2025-07-15"
  categoria_id: number
  categoria: { id: number; nombre: string }
}

export function useGastosPorCategoriaDelMes(mes: number, anio: number) {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGastos() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchExpenses()
        setGastos(data)
      } catch (e: any) {
        setError(e.message || "Error de red")
      }
      setLoading(false)
    }
    fetchGastos()
  }, [mes, anio])

  // Filtrar y agrupar por categoría solo los del mes/año actual
  const gastosPorCategoria: Record<number, { nombre: string; total: number }> = {}
  gastos.forEach((g) => {
    // Parsear fecha como local para evitar desfase
    let year, month, day
    if (/^\d{4}-\d{2}-\d{2}$/.test(g.fecha)) {
      // Formato yyyy-MM-dd
      [year, month, day] = g.fecha.split("-").map(Number)
    } else {
      // Otro formato, usar Date
      const fechaObj = new Date(g.fecha)
      year = fechaObj.getFullYear()
      month = fechaObj.getMonth() + 1
    }
    if (year === anio && month === mes) {
      if (!gastosPorCategoria[g.categoria_id]) {
        gastosPorCategoria[g.categoria_id] = { nombre: g.categoria.nombre, total: 0 }
      }
      gastosPorCategoria[g.categoria_id].total += g.monto
    }
  })

  return { gastosPorCategoria, loading, error }
}
