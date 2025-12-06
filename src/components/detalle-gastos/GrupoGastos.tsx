'use client'

import React from 'react'
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Expense } from '@/services/expenses'
import { GastoCard } from './GastoCard'
import { GastoTableRow } from './GastoTableRow'
import type { GastoGroup } from '../../hooks/useGastosGrouping'

interface GrupoGastosProps {
  group: GastoGroup
  index: number
  isExpanded: boolean
  onToggle: (groupTitle: string) => void
  formatMoney: (amount: number) => string
  formatDate: (dateString: string) => string
  onDeleteGasto: (id: string) => void
}

export function GrupoGastos({ 
  group, 
  index,
  isExpanded,
  onToggle,
  formatMoney, 
  formatDate, 
  onDeleteGasto
}: GrupoGastosProps) {
  return (
    <div className="border dark:border-neutral-700 rounded-lg">
      <div 
        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors rounded-t-lg"
        onClick={() => onToggle(index.toString())}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          )}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{group.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {group.gastos.length} gasto{group.gastos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-red-600 dark:text-red-400">
            {formatMoney(group.total)}
          </p>
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t dark:border-neutral-700">
          {/* Vista de tabla para desktop */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-neutral-800 hover:bg-transparent dark:hover:bg-transparent">
                  <TableHead className="px-4 py-3 dark:text-gray-300">Descripción</TableHead>
                  <TableHead className="px-3 py-3 dark:text-gray-300">Categoría</TableHead>
                  <TableHead className="px-3 py-3 dark:text-gray-300">Método de Pago</TableHead>
                  <TableHead className="px-3 py-3 dark:text-gray-300">Fecha</TableHead>
                  <TableHead className="px-3 py-3 text-right dark:text-gray-300">Monto</TableHead>
                  <TableHead className="px-3 py-3 text-center dark:text-gray-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.gastos.map((gasto) => (
                  <GastoTableRow
                    key={gasto.id}
                    gasto={gasto}
                    onDeleteGasto={onDeleteGasto}
                    formatMoney={formatMoney}
                    formatDate={formatDate}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Vista de tarjetas para móvil y tablet */}
          <div className="lg:hidden space-y-3 p-4">
            {group.gastos.map((gasto) => (
              <GastoCard
                key={gasto.id}
                gasto={gasto}
                onDeleteGasto={onDeleteGasto}
                formatMoney={formatMoney}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
