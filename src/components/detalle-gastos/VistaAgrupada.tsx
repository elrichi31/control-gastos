'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt } from 'lucide-react'
import type { Expense } from '@/services/expenses'
import { GrupoGastos } from './GrupoGastos'
import type { GastoGroup } from '../../hooks/useGastosGrouping'

interface VistaAgrupadaProps {
  gastos: Expense[]
  groupedGastos: GastoGroup[]
  activeFiltersCount: number
  expandedGroups: Set<string>
  formatMoney: (amount: number) => string
  formatDate: (dateString: string) => string
  onDeleteGasto: (id: string) => void
  onToggleGroup: (groupTitle: string) => void
}

export function VistaAgrupada({ 
  gastos,
  groupedGastos,
  activeFiltersCount,
  expandedGroups,
  formatMoney, 
  formatDate, 
  onDeleteGasto,
  onToggleGroup
}: VistaAgrupadaProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Resultados ({gastos.length} gastos en {groupedGastos.length} grupos)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {groupedGastos.length === 0 ? (
          <div className="text-center py-12 px-6">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No se encontraron gastos
            </h3>
            <p className="text-gray-600">
              {activeFiltersCount > 0 
                ? "Intenta ajustar los filtros para ver más resultados"
                : "Aún no hay gastos registrados"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {groupedGastos.map((group, index) => (
              <GrupoGastos
                key={index}
                group={group}
                index={index}
                isExpanded={expandedGroups.has(index.toString())}
                onToggle={onToggleGroup}
                formatMoney={formatMoney}
                formatDate={formatDate}
                onDeleteGasto={onDeleteGasto}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}