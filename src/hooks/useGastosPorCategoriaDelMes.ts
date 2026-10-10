import { useExpensesStore } from "@/hooks/useExpensesStore"

export function useGastosPorCategoriaDelMes(mes: number, anio: number) {
  const { gastos, loading, error } = useExpensesStore()

  // Filtrar y agrupar por categoría solo los del mes/año actual
  const gastosPorCategoria: Record<number, { nombre: string; total: number }> = {}
  gastos.forEach((g) => {
    // Parsear fecha como local para evitar desfase
    let year, month
    if (/^\d{4}-\d{2}-\d{2}$/.test(g.fecha)) {
      // Formato yyyy-MM-dd
      [year, month] = g.fecha.split("-").map(Number)
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
