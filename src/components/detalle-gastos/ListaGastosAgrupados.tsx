"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Receipt, Trash2, Tag, CreditCard, Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { Gasto } from '@/hooks/useGastosFiltrados'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

interface ListaGastosAgrupadosProps {
  gastos: Gasto[]
  activeFiltersCount: number
  formatMoney: (amount: number) => string
  formatDate: (dateString: string) => string
  onDeleteGasto: (id: string) => void
  groupBy: "none" | "day" | "week" | "month"
}

interface GastoGroup {
  title: string
  gastos: Gasto[]
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

  // Si no hay agrupación, mostrar lista normal
  if (groupBy === "none" || !groupedGastos) {
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
                <GastoItem
                  key={gasto.id}
                  gasto={gasto}
                  onDeleteGasto={onDeleteGasto}
                />
              ))}
            </div>
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
      <CardContent>
        {groupedGastos.length === 0 ? (
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
                    <div className="p-4 space-y-3 border-t">
                      {group.gastos.map((gasto) => (
                        <GastoItem
                          key={gasto.id}
                          gasto={gasto}
                          onDeleteGasto={onDeleteGasto}
                        />
                      ))}
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

import { ExpenseItem } from '@/components/ExpenseItem'

// Componente reutilizable para mostrar un gasto individual
function GastoItem({ 
  gasto, 
  onDeleteGasto 
}: {
  gasto: Gasto
  onDeleteGasto: (id: string) => void
}) {
  return (
    <ExpenseItem
      expense={gasto}
      onDelete={onDeleteGasto}
    />
  )
}
