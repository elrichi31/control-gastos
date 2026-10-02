"use client"

import React from 'react'
import Link from 'next/link'
import { Receipt } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Expense } from '@/services/expenses'
import { useGastosGrouping } from '../../hooks/useGastosGrouping'
import { VistaSinAgrupar } from './VistaSinAgrupar'
import { VistaAgrupada } from './VistaAgrupada'

interface ListaGastosAgrupadosProps {
  gastos: Expense[]
  hasExpenses?: boolean
  onResetFilters?: () => void
  activeFiltersCount: number
  formatMoney: (amount: number) => string
  formatDate: (dateString: string) => string
  onDeleteGasto: (id: string) => void
  groupBy: "none" | "day" | "week" | "month"
}

export function ListaGastosAgrupados({ 
  gastos,
  activeFiltersCount,
  hasExpenses = activeFiltersCount > 0,
  onResetFilters,
  formatMoney, 
  formatDate, 
  onDeleteGasto,
  groupBy 
}: ListaGastosAgrupadosProps) {
  
  const { groupedGastos, expandedGroups, toggleGroup } = useGastosGrouping(gastos, groupBy)

  if (gastos.length === 0) return (
    <Card><CardContent className="px-5 py-10 text-center">
      <Receipt aria-hidden="true" className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
      <h2 className="text-base font-semibold">{hasExpenses ? 'No hay gastos con estos filtros' : 'Aún no tienes gastos'}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{hasExpenses ? 'Prueba otro período o consulta todo tu historial.' : 'Registra el primero para empezar a ver tu actividad.'}</p>
      {hasExpenses ? <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onResetFilters}>Ver todos los gastos</Button> : <Button asChild size="sm" className="mt-4"><Link href="/form">Agregar gasto</Link></Button>}
    </CardContent></Card>
  )

  // Si no hay agrupación, mostrar vista simple
  if (groupBy === "none" || !groupedGastos) {
    return (
      <VistaSinAgrupar
        gastos={gastos}
        activeFiltersCount={activeFiltersCount}
        formatMoney={formatMoney}
        formatDate={formatDate}
        onDeleteGasto={onDeleteGasto}
      />
    )
  }

  // Vista agrupada
  return (
    <VistaAgrupada
      gastos={gastos}
      groupedGastos={groupedGastos}
      activeFiltersCount={activeFiltersCount}
      expandedGroups={expandedGroups}
      formatMoney={formatMoney}
      formatDate={formatDate}
      onDeleteGasto={onDeleteGasto}
      onToggleGroup={toggleGroup}
    />
  )
}
