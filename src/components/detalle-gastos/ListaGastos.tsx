"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Receipt, Trash2, Tag, CreditCard, Calendar } from 'lucide-react'
import { Gasto } from '@/hooks/useGastosFiltrados'

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
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{gasto.descripcion}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {gasto.categoria?.nombre || "Sin categoría"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <CreditCard className="w-3 h-3 mr-1" />
                          {gasto.metodo_pago?.nombre || "Sin método"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(gasto.fecha)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        {formatMoney(gasto.monto)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 sm:mt-0 sm:ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteGasto(gasto.id.toString())}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
