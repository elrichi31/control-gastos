"use client"

import { StatTile, StatTileRow } from '@/components/stats/stat-tile'

interface EstadisticasResumenProps {
  statistics: {
    total: number
    count: number
    average: number
    categoryStats: Array<{
      categoria: string
      total: number
      count: number
      percentage: number
    }>
  }
  formatMoney: (amount: number) => string
}

export function EstadisticasResumen({ statistics, formatMoney }: EstadisticasResumenProps) {
  return (
    <StatTileRow>
      <StatTile etiqueta="Total gastado" valor={formatMoney(statistics.total)} ayuda="según filtros actuales" />
      <StatTile etiqueta="Transacciones" valor={String(statistics.count)} ayuda="gastos encontrados" />
      <StatTile etiqueta="Ticket promedio" valor={formatMoney(statistics.average)} ayuda="por gasto" />
      <StatTile etiqueta="Categorías" valor={String(statistics.categoryStats.length)} ayuda="con gastos registrados" />
    </StatTileRow>
  )
}
