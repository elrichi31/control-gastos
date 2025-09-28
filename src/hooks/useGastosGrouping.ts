import React from 'react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { toLocalDateFromString } from '@/lib/utils'
import type { Expense } from '@/services/expenses'

export interface GastoGroup {
  title: string
  gastos: Expense[]
  total: number
}

export function useGastosGrouping(gastos: Expense[], groupBy: "none" | "day" | "week" | "month") {
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

  const getGroupTitle = (dateString: string, groupBy: "day" | "week" | "month"): string => {
    switch (groupBy) {
      case "day": {
        const localDate = toLocalDateFromString(dateString)
        return format(localDate, "EEEE d 'de' MMMM yyyy", { locale: es })
      }
      case "week": {
        const localDate = toLocalDateFromString(dateString)
        const weekStart = startOfWeek(localDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(localDate, { weekStartsOn: 1 })
        return `Semana del ${format(weekStart, "d MMM", { locale: es })} al ${format(weekEnd, "d MMM", { locale: es })}`
      }
      case "month": {
        const localDate = toLocalDateFromString(dateString)
        return format(localDate, "MMMM yyyy", { locale: es })
      }
      default:
        return ""
    }
  }

  const getGroupKey = (dateString: string, groupBy: "day" | "week" | "month"): string => {
    switch (groupBy) {
      case "day":
        return dateString // Ya está en formato "yyyy-MM-dd"
      case "week":
        const localDate = toLocalDateFromString(dateString)
        const weekStart = startOfWeek(localDate, { weekStartsOn: 1 })
        return format(weekStart, "yyyy-'W'ww")
      case "month":
        return dateString.slice(0, 7) // Tomar solo "yyyy-MM"
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
      const groupKey = getGroupKey(gasto.fecha, groupBy)
      const groupTitle = getGroupTitle(gasto.fecha, groupBy)

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
      const dateA = toLocalDateFromString(a.gastos[0].fecha)
      const dateB = toLocalDateFromString(b.gastos[0].fecha)
      return dateB.getTime() - dateA.getTime()
    })
  }, [gastos, groupBy])

  // Expandir todos los grupos por defecto al cargar
  React.useEffect(() => {
    if (groupBy !== "none" && groupedGastos && expandedGroups.size === 0) {
      setExpandedGroups(new Set(groupedGastos.map((_, index) => index.toString())))
    }
  }, [groupedGastos, expandedGroups.size, groupBy])

  return {
    groupedGastos,
    expandedGroups,
    toggleGroup
  }
}