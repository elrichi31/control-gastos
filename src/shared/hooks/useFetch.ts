import { useState, useEffect } from "react"

interface UseFetchOptions {
  url: string
  deps?: any[] // Dependencias para refetch
  transform?: (data: any) => any // Función de transformación de datos
}

interface UseFetchResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook genérico para fetch de datos con manejo de estado
 * Reduce código duplicado en otros hooks
 */
export function useFetch<T>({ url, deps = [], transform }: UseFetchOptions): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Error al obtener datos: ${res.status}`)
      const result = await res.json()
      const transformedData = transform ? transform(result) : result
      setData(transformedData)
    } catch (e: any) {
      setError(e.message || "Error de red")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, refetch: fetchData }
}

/**
 * Hook específico para gastos con transformación estándar
 */
export function useGastosFetch() {
  return useFetch({
    url: "/api/gastos",
    transform: (data: any[]) => 
      data.map((gasto: any) => ({
        ...gasto,
        monto: parseFloat(gasto.monto),
        metodo_pago: gasto.metodo_pago || { id: 1, nombre: "Efectivo" }
      }))
  })
}
