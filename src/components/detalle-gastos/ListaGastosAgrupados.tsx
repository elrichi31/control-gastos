"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Receipt, Trash2, Tag, CreditCard, Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { Expense } from '@/services/expenses'
import { GastoCard } from './GastoCard'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

interface ListaGastosAgrupadosProps {
  gastos: Expense[]
  activeFiltersCount: number
  formatMoney: (amount: number) => string
  formatDate: (dateString: string) => string
  onDeleteGasto: (id: string) => void
  groupBy: "none" | "day" | "week" | "month"
}

interface GastoGroup {
  title: string
  gastos: Expense[]
  total: number
}

export function ListaGastosAgrupados({ 
  gastos, 
  activeFiltersCount, 
  formatMoney, 
  formatDate, 
  onDeleteGasto,
  groupBy 
}: ListaGastosAgrupadosProps) {
  
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set())

  const toggleGroup = (groupTitle: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupTitle)) {
      newExpanded.delete(groupTitle)
    } else {
      newExpanded.add(groupTitle)
    }
    setExpandedGroups(newExpanded)
  }

  const getGroupTitle = (date: Date, groupBy: "day" | "week" | "month"): string => {
    switch (groupBy) {
      case "day": {
        // Convertimos a fecha local para evitar problemas de zona horaria
        const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
        return format(localDate, "EEEE d 'de' MMMM yyyy", { locale: es })
      }
      case "week": {
        const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
        const weekStart = startOfWeek(localDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(localDate, { weekStartsOn: 1 })
        return `Semana del ${format(weekStart, "d MMM", { locale: es })} al ${format(weekEnd, "d MMM", { locale: es })}`
      }
      case "month": {
        const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
        return format(localDate, "MMMM yyyy", { locale: es })
      }
      default:
        return ""
    }
  }

  const getGroupKey = (date: Date, groupBy: "day" | "week" | "month"): string => {
    switch (groupBy) {
      case "day":
        return format(date, "yyyy-MM-dd")
      case "week":
        const weekStart = startOfWeek(date, { weekStartsOn: 1 })
        return format(weekStart, "yyyy-'W'ww")
      case "month":
        return format(date, "yyyy-MM")
      default:
        return ""
    }
  }

  const groupedGastos = React.useMemo(() => {
    if (groupBy === "none") {
      return null
    }

    const groups: Record<string, GastoGroup> = {}

    gastos.forEach(gasto => {
      const date = new Date(gasto.fecha)
      const groupKey = getGroupKey(date, groupBy)
      const groupTitle = getGroupTitle(date, groupBy)

      if (!groups[groupKey]) {
        groups[groupKey] = {
          title: groupTitle,
          gastos: [],
          total: 0
        }
      }

      groups[groupKey].gastos.push(gasto)
      groups[groupKey].total += gasto.monto
    })

    // Convertir a array y ordenar por fecha (más reciente primero)
    return Object.values(groups).sort((a, b) => {
      const dateA = new Date(a.gastos[0].fecha)
      const dateB = new Date(b.gastos[0].fecha)
      return dateB.getTime() - dateA.getTime()
    })
  }, [gastos, groupBy])

  // Expandir todos los grupos por defecto al cargar - SIEMPRE se ejecuta
  React.useEffect(() => {
    if (groupBy !== "none" && groupedGastos && expandedGroups.size === 0) {
      setExpandedGroups(new Set(groupedGastos.map((_, index) => index.toString())))
    }
  }, [groupedGastos, expandedGroups.size, groupBy])

  // Si no hay agrupación, mostrar tabla normal
  if (groupBy === "none" || !groupedGastos) {
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
            <div className="lg:hidden space-y-3">
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
          <div className="space-y-4">
            {groupedGastos.map((group, index) => {
              const isExpanded = expandedGroups.has(index.toString())
              return (
                <div key={index} className="border rounded-lg">
                  <div 
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors rounded-t-lg"
                    onClick={() => toggleGroup(index.toString())}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{group.title}</h3>
                        <p className="text-sm text-gray-600">
                          {group.gastos.length} gasto{group.gastos.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        {formatMoney(group.total)}
                      </p>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t">
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
                      <div className="lg:hidden space-y-3">
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
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Componente para mostrar un gasto como fila de tabla
function GastoTableRow({ 
  gasto, 
  onDeleteGasto,
  formatMoney,
  formatDate
}: {
  gasto: Expense
  onDeleteGasto: (id: string) => void
  formatMoney: (amount: number) => string
  formatDate: (dateString: string) => string
}) {
  const getCategoryColor = (categoria: string) => {
    const colors = {
      'Alimentación': 'bg-orange-100 text-orange-800',
      'Transporte': 'bg-blue-100 text-blue-800', 
      'Entretenimiento': 'bg-purple-100 text-purple-800',
      'Salud': 'bg-red-100 text-red-800',
      'Hogar': 'bg-green-100 text-green-800',
      'Educación': 'bg-indigo-100 text-indigo-800',
      'Trabajo': 'bg-gray-100 text-gray-800',
      'Otros': 'bg-yellow-100 text-yellow-800',
    }
    return colors[categoria as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentMethodIcon = (metodo: string) => {
    switch (metodo?.toLowerCase()) {
      case 'tarjeta de débito':
      case 'tarjeta de crédito':
        return <CreditCard className="h-4 w-4" />
      case 'efectivo':
        return <Receipt className="h-4 w-4" />
      case 'transferencia':
        return <Calendar className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-medium px-4 py-4 w-[180px] min-w-[180px]">
        <div 
          className="text-sm truncate pr-2" 
          title={gasto.descripcion}
        >
          {gasto.descripcion}
        </div>
      </TableCell>
      <TableCell className="px-3 py-4 w-[140px] min-w-[140px]">
        <Badge 
          variant="secondary" 
          className={`${getCategoryColor(gasto.categoria?.nombre || 'Otros')} text-xs px-2 py-1 truncate block max-w-full`}
        >
          {gasto.categoria?.nombre || 'Otros'}
        </Badge>
      </TableCell>
      <TableCell className="px-3 py-4 w-[150px] min-w-[150px]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0">
            {getPaymentMethodIcon(gasto.metodo_pago?.nombre || '')}
          </div>
          <span className="text-xs truncate">
            {gasto.metodo_pago?.nombre || 'Sin método'}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-3 py-4 w-[100px] min-w-[100px]">
        <span className="text-xs whitespace-nowrap">
          {formatDate(gasto.fecha)}
        </span>
      </TableCell>
      <TableCell className="text-right font-semibold text-red-600 px-3 py-4 w-[100px] min-w-[100px]">
        <span className="text-sm whitespace-nowrap">
          {formatMoney(gasto.monto)}
        </span>
      </TableCell>
      <TableCell className="text-center px-3 py-4 w-[80px] min-w-[80px]">
        <Button
          size="sm"
          onClick={() => onDeleteGasto(gasto.id.toString())}
          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 h-8 w-8 bg-transparent border-0 shadow-none"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}
