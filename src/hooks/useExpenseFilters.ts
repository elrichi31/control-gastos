// src/hooks/useExpenseFilters.ts
import { useState, useMemo } from 'react'
import { startOfYear, endOfYear } from 'date-fns'
import { toLocalDateFromString } from '@/lib/utils'
import type { Expense } from '@/services/expenses'

export interface FilterOptions {
  search: string
  category: string
  paymentMethod: string
  dateRange: "current-month" | "year" | "all-time" | "custom"
  year: string
  dateFrom: string
  dateTo: string
  minAmount: string
  maxAmount: string
  sortBy: "date" | "amount" | "category" | "description"
  sortOrder: "asc" | "desc"
  groupBy: "none" | "day" | "week" | "month"
}

const initialFilters: FilterOptions = {
  search: "",
  category: "",
  paymentMethod: "",
  dateRange: "current-month",
  year: "",
  dateFrom: "",
  dateTo: "",
  minAmount: "",
  maxAmount: "",
  sortBy: "date",
  sortOrder: "desc",
  groupBy: "none"
}

export function useExpenseFilters(gastos: Expense[]) {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters(initialFilters)
  }

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => 
      key !== "sortBy" && key !== "sortOrder" && key !== "groupBy" && 
      value !== "" && value !== "current-month"
    ).length
  }, [filters])

  const filteredGastos = useMemo(() => {
    let filtered = [...gastos]

    // Filtro por texto de búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(gasto => 
        gasto.descripcion.toLowerCase().includes(searchLower) ||
        gasto.categoria.nombre.toLowerCase().includes(searchLower) ||
        (gasto.metodo_pago?.nombre.toLowerCase().includes(searchLower))
      )
    }

    // Filtro por categoría
    if (filters.category) {
      filtered = filtered.filter(gasto => 
        gasto.categoria_id.toString() === filters.category
      )
    }

    // Filtro por método de pago
    if (filters.paymentMethod) {
      filtered = filtered.filter(gasto => 
        gasto.metodo_pago?.id?.toString() === filters.paymentMethod
      )
    }

    // Filtro por monto mínimo
    if (filters.minAmount) {
      const minAmount = parseFloat(filters.minAmount)
      if (!isNaN(minAmount)) {
        filtered = filtered.filter(gasto => gasto.monto >= minAmount)
      }
    }

    // Filtro por monto máximo
    if (filters.maxAmount) {
      const maxAmount = parseFloat(filters.maxAmount)
      if (!isNaN(maxAmount)) {
        filtered = filtered.filter(gasto => gasto.monto <= maxAmount)
      }
    }

    // Filtro por rango de fechas
    const now = new Date()
    let dateFrom: Date | null = null
    let dateTo: Date | null = null

    if (filters.dateRange === "current-month") {
      // Usar la fecha actual y asegurar que el rango cubra todo el mes
      const today = new Date()
      dateFrom = new Date(today.getFullYear(), today.getMonth(), 1) // primer día del mes
      dateTo = new Date(today.getFullYear(), today.getMonth() + 1, 0) // último día del mes
      
      console.log('🔍 Filtrado por mes actual:', {
        today: today.toLocaleDateString(),
        month: today.getMonth() + 1, // mes actual (1-indexado)
        year: today.getFullYear(),
        dateFrom: dateFrom.toLocaleDateString(),
        dateTo: dateTo.toLocaleDateString(),
        totalGastos: gastos.length
      })
    } else if (filters.dateRange === "year") {
      // Use the specific year if provided, otherwise current year
      const targetYear = filters.year ? parseInt(filters.year) : new Date().getFullYear()
      if (!isNaN(targetYear)) {
        dateFrom = startOfYear(new Date(targetYear, 0, 1))
        dateTo = endOfYear(new Date(targetYear, 0, 1))
      }
    } else if (filters.dateRange === "all-time") {
      // No date filtering for all-time
      dateFrom = null
      dateTo = null
    } else if (filters.dateRange === "custom" && filters.dateFrom && filters.dateTo) {
      dateFrom = new Date(filters.dateFrom + 'T00:00:00')
      dateTo = new Date(filters.dateTo + 'T23:59:59')
    }

    if (dateFrom && dateTo) {
      const beforeFilter = filtered.length
      filtered = filtered.filter(gasto => {
        // Usar la utilidad existente que maneja bien las fechas
        const gastoDate = toLocalDateFromString(gasto.fecha)
        
        const isInRange = gastoDate >= dateFrom! && gastoDate <= dateTo!
        
        // Log some examples for debugging
        if (beforeFilter > 0 && beforeFilter <= 5) {
          console.log('🧾 Gasto fecha:', {
            descripcion: gasto.descripcion,
            fecha: gasto.fecha,
            gastoDate: gastoDate.toLocaleDateString(),
            dateFrom: dateFrom!.toLocaleDateString(),
            dateTo: dateTo!.toLocaleDateString(),
            isInRange
          })
        }
        
        return isInRange
      })
      
      console.log(`📊 Filtrado por fechas: ${beforeFilter} → ${filtered.length} gastos`)
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          break
        case 'amount':
          comparison = a.monto - b.monto
          break
        case 'description':
          comparison = a.descripcion.localeCompare(b.descripcion)
          break
        case 'category':
          comparison = a.categoria.nombre.localeCompare(b.categoria.nombre)
          break
        default:
          comparison = 0
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [gastos, filters])

  return {
    filters,
    filteredGastos,
    showAdvancedFilters,
    activeFiltersCount,
    handleFilterChange,
    clearFilters,
    setShowAdvancedFilters
  }
}