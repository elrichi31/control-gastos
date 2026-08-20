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
    <div className="border border-border rounded-lg">
      <div 
        className="flex items-center justify-between p-4 bg-muted cursor-pointer hover:bg-muted transition-colors rounded-t-lg"
        onClick={() => onToggle(index.toString())}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <h3 className="font-semibold text-foreground">{group.title}</h3>
            <p className="text-sm text-muted-foreground">
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
        <div className="border-t border-border">
          {/* Vista de tabla para desktop */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent dark:hover:bg-transparent">
                  <TableHead className="px-4 py-3 text-muted-foreground">Descripción</TableHead>
                  <TableHead className="px-3 py-3 text-muted-foreground">Categoría</TableHead>
                  <TableHead className="px-3 py-3 text-muted-foreground">Método de Pago</TableHead>
                  <TableHead className="px-3 py-3 text-muted-foreground">Fecha</TableHead>
                  <TableHead className="px-3 py-3 text-right text-muted-foreground">Monto</TableHead>
                  <TableHead className="px-3 py-3 text-center text-muted-foreground">Acciones</TableHead>
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
