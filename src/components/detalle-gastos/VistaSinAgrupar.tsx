'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Resultados ({gastos.length} gastos)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {gastos.length === 0 ? (
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
          <>
            {/* Vista de tabla para desktop */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-3">Descripción</TableHead>
                    <TableHead className="px-3 py-3">Categoría</TableHead>
                    <TableHead className="px-3 py-3">Método de Pago</TableHead>
                    <TableHead className="px-3 py-3">Fecha</TableHead>
                    <TableHead className="px-3 py-3 text-right">Monto</TableHead>
                    <TableHead className="px-3 py-3 text-center">Acciones</TableHead>
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
            <div className="lg:hidden space-y-3 p-4">
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
          </>
        )}
      </CardContent>
    </Card>
  )
}