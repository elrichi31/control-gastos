"use client"

import React from 'react'
import { Expense } from '@/services/expenses'
import { useGastosGrouping } from '../../hooks/useGastosGrouping'
import { VistaSinAgrupar } from './VistaSinAgrupar'
import { VistaAgrupada } from './VistaAgrupada'

interface ListaGastosAgrupadosProps {
  gastos: Expense[]
  activeFiltersCount: number
  formatMoney: (amount: number) => string
  formatDate: (dateString: string) => string
  onDeleteGasto: (id: string) => void
  groupBy: "none" | "day" | "week" | "month"
}

export function ListaGastosAgrupados({ 
  gastos, 
  activeFiltersCount, 
  formatMoney, 
  formatDate, 
  onDeleteGasto,
  groupBy 
}: ListaGastosAgrupadosProps) {
  
  const { groupedGastos, expandedGroups, toggleGroup } = useGastosGrouping(gastos, groupBy)

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
