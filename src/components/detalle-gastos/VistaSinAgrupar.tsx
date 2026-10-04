'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Receipt } from 'lucide-react'
import type { Expense } from '@/services/expenses'
import { GastoCard } from './GastoCard'
import { GastoTableRow } from './GastoTableRow'

interface VistaSinAgruparProps {
  gastos: Expense[]
  activeFiltersCount: number
  formatMoney: (amount: number) => string
  formatDate: (dateString: string) => string
  onDeleteGasto: (id: string) => void
}

export function VistaSinAgrupar({ 
  gastos, 
  activeFiltersCount, 
  formatMoney, 
  formatDate, 
  onDeleteGasto
}: VistaSinAgruparProps) {
  return (
    <Card className="overflow-hidden lg:fill-y">
      <CardContent className="p-0 lg:fill-y">
        {gastos.length === 0 ? (
          <div className="text-center py-12 px-6">
            <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No se encontraron gastos
            </h3>
            <p className="text-muted-foreground">
              {activeFiltersCount > 0 
                ? "Intenta ajustar los filtros para ver más resultados"
                : "Aún no hay gastos registrados"
              }
            </p>
          </div>
        ) : (
          <>
            {/* Vista de tabla para desktop */}
            <div className="hidden lg:fill-y">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                    <TableHead className="px-4 py-3 text-muted-foreground">Descripción</TableHead>
                    <TableHead className="px-3 py-3 text-muted-foreground">Categoría</TableHead>
                    <TableHead className="px-3 py-3 text-muted-foreground">Método de Pago</TableHead>
                    <TableHead className="px-3 py-3 text-muted-foreground">Fecha</TableHead>
                    <TableHead className="px-3 py-3 text-right text-muted-foreground">Monto</TableHead>
                    <TableHead className="px-3 py-3 text-center text-muted-foreground">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gastos.map((gasto) => (
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
            <div className="lg:hidden divide-y divide-border">
              {gastos.map((gasto) => (
                <GastoCard
                  key={gasto.id}
                  gasto={gasto}
                  onDeleteGasto={onDeleteGasto}
                  formatMoney={formatMoney}
                  formatDate={formatDate}
                />
              ))}
            </div>
            <div className="flex divide-x divide-border border-t border-border text-xs text-muted-foreground">
              <p className="px-4 py-2.5"><span className="font-semibold text-foreground tabular-nums">{gastos.length}</span> gastos en vista</p>
              <p className="px-4 py-2.5">Total <span className="font-semibold text-foreground tabular-nums">{formatMoney(gastos.reduce((sum, g) => sum + g.monto, 0))}</span></p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
