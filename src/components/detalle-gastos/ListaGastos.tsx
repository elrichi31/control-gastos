"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Receipt, Trash2, Tag, CreditCard, Calendar } from 'lucide-react'
import { Gasto } from '@/shared/hooks/useGastosFiltrados'

interface ListaGastosProps {
  gastos: Gasto[]
  activeFiltersCount: number
  formatMoney: (amount: number) => string
  formatDate: (dateString: string) => string
  onDeleteGasto: (id: string) => void
}

export function ListaGastos({ 
  gastos, 
  activeFiltersCount, 
  formatMoney, 
  formatDate, 
  onDeleteGasto 
}: ListaGastosProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Resultados ({gastos.length} gastos)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {gastos.length === 0 ? (
          <div className="text-center py-12">
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
          <div className="space-y-3">
            {gastos.map((gasto) => (
              <div
                key={gasto.id}
                className="bg-white border rounded-lg p-2.5 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 truncate">
                      {gasto.descripcion}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {gasto.categoria?.nombre || "Sin categoría"}
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {gasto.metodo_pago?.nombre || "Sin método"}
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(gasto.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-red-600 text-sm whitespace-nowrap">
                      {formatMoney(gasto.monto)}
                    </p>
                    <button
                      onClick={() => onDeleteGasto(gasto.id.toString())}
                      className="h-7 w-7 rounded-full text-gray-400 hover:text-red-500 flex items-center justify-center"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
