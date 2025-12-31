"use client"

import React, { useMemo, useState, useEffect } from "react"
import { useGastosFiltrados } from "@/hooks/useGastosFiltrados"
import { format, startOfMonth, endOfMonth, isToday, isYesterday, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { toDateWithTime } from "@/lib/utils"
import { PageTitle } from "@/components/PageTitle"
import {
  DashboardHeader,
  SummaryCards,
  ExpenseCalendar,
  RecentExpenses,
  QuickActions,
  MonthlyComparison,
  DaySummary,
  BudgetCategoryProgress
} from "@/components/dashboard"

const currentDate = new Date()
const currentMonth = startOfMonth(currentDate)
const currentMonthEnd = endOfMonth(currentDate)
const lastMonth = startOfMonth(subMonths(currentDate, 1))
const lastMonthEnd = endOfMonth(subMonths(currentDate, 1))

export default function DashboardPage() {
    const { gastos, loading } = useGastosFiltrados()
    const [budgetTotal, setBudgetTotal] = useState<number | undefined>(undefined)
    const [budgetId, setBudgetId] = useState<string | undefined>(undefined)
    const [budgetCategories, setBudgetCategories] = useState<any[]>([])
    const [loadingBudget, setLoadingBudget] = useState(true)

    // Obtener presupuesto del mes actual
    useEffect(() => {
        const fetchCurrentMonthBudget = async () => {
            try {
                const year = currentDate.getFullYear()
                const month = currentDate.getMonth() + 1

                const response = await fetch(`/api/presupuestos?anio=${year}`)
                if (response.ok) {
                    const budgets = await response.json()
                    const currentMonthBudget = budgets.find((b: any) => b.mes === month && b.anio === year)

                    if (currentMonthBudget) {
                        setBudgetTotal(currentMonthBudget.total)
                        setBudgetId(currentMonthBudget.id)

                        // Obtener categorías del presupuesto
                        const categoriesResponse = await fetch(`/api/presupuesto-mensual-detalle?presupuesto_mensual_id=${currentMonthBudget.id}`)
                        if (categoriesResponse.ok) {
                            const categoriesData = await categoriesResponse.json()
                            setBudgetCategories(categoriesData)
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching budget:', error)
            } finally {
                setLoadingBudget(false)
            }
        }

        fetchCurrentMonthBudget()
    }, [])

    // Gastos del mes actual
    const currentMonthExpenses = useMemo(() => {
        return gastos.filter(g => {
            // Parsear fecha correctamente evitando problemas de zona horaria
            const fecha = toDateWithTime(g.fecha)
            return fecha >= currentMonth && fecha <= currentMonthEnd
        })
    }, [gastos])

    // Gastos del mes pasado
    const lastMonthExpenses = useMemo(() => {
        return gastos.filter(g => {
            const fecha = toDateWithTime(g.fecha)
            return fecha >= lastMonth && fecha <= lastMonthEnd
        })
    }, [gastos])

    // Gastos de hoy
    const todayExpenses = useMemo(() => {
        return gastos.filter(g => {
            const fecha = toDateWithTime(g.fecha)
            return isToday(fecha)
        })
    }, [gastos])

    // Gastos de ayer
    const yesterdayExpenses = useMemo(() => {
        return gastos.filter(g => {
            const fecha = toDateWithTime(g.fecha)
            return isYesterday(fecha)
        })
    }, [gastos])

    // Últimos 5 gastos
    const recentExpenses = useMemo(() => {
        return gastos
            .sort((a, b) => {
                const fechaA = toDateWithTime(a.fecha)
                const fechaB = toDateWithTime(b.fecha)
                return fechaB.getTime() - fechaA.getTime()
            })
            .slice(0, 5)
    }, [gastos])

    // Totales
    const currentMonthTotal = currentMonthExpenses.reduce((sum, g) => sum + g.monto, 0)
    const lastMonthTotal = lastMonthExpenses.reduce((sum, g) => sum + g.monto, 0)
    const todayTotal = todayExpenses.reduce((sum, g) => sum + g.monto, 0)
    const monthlyChange = currentMonthTotal - lastMonthTotal
    const monthlyChangePercentage = lastMonthTotal > 0 ? ((monthlyChange / lastMonthTotal) * 100) : 0

    // Calcular ahorro del mes (presupuesto - gasto)
    const savingsAmount = budgetTotal !== undefined ? budgetTotal - currentMonthTotal : undefined

    // Categoría con más gasto este mes
    const topCategory = useMemo(() => {
        const categoryTotals: Record<string, { name: string; total: number }> = {}
        currentMonthExpenses.forEach(g => {
            if (!categoryTotals[g.categoria_id]) {
                categoryTotals[g.categoria_id] = { name: g.categoria.nombre, total: 0 }
            }
            categoryTotals[g.categoria_id].total += g.monto
        })

        const topCat = Object.values(categoryTotals).sort((a, b) => b.total - a.total)[0]
        return topCat || { name: "N/A", total: 0 }
    }, [currentMonthExpenses])

    // Calcular progreso de categorías del presupuesto
    const categoryProgress = useMemo(() => {
        if (budgetCategories.length === 0) return []

        const categoryTotals: Record<number, number> = {}
        currentMonthExpenses.forEach(g => {
            categoryTotals[g.categoria_id] = (categoryTotals[g.categoria_id] || 0) + g.monto
        })

        return budgetCategories.map(cat => {
            // El presupuesto por categoría es la suma de los movimientos (gastos presupuestados)
            const presupuestado = cat.movimientos?.reduce((sum: number, mov: any) => {
                const monto = typeof mov.monto === "string" ? parseFloat(mov.monto) : mov.monto || 0
                return sum + monto
            }, 0) || 0

            return {
                id: cat.categoria_id,
                nombre: cat.categoria.nombre,
                icono: cat.categoria.icono || '📊',
                gastado: categoryTotals[cat.categoria_id] || 0,
                presupuestado: presupuestado
            }
        })
    }, [budgetCategories, currentMonthExpenses])

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-6 bg-gray-50 dark:bg-neutral-950 min-h-screen">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-neutral-950 min-h-screen">
            <PageTitle customTitle={`Dashboard - ${format(currentDate, "MMMM yyyy", { locale: es })} - BethaSpend`} />
            
            {/* Header */}
            <DashboardHeader currentDate={currentDate} />

            {/* Cards de resumen */}
            <SummaryCards
                currentMonthTotal={currentMonthTotal}
                todayTotal={todayTotal}
                todayCount={todayExpenses.length}
                topCategory={topCategory}
                totalExpenses={gastos.length}
                currentMonthCount={currentMonthExpenses.length}
                monthlyChange={monthlyChange}
                monthlyChangePercentage={monthlyChangePercentage}
                budgetTotal={budgetTotal}
                savingsAmount={savingsAmount}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendario mensual */}
                <ExpenseCalendar currentDate={currentDate} expenses={currentMonthExpenses} />

                {/* Gastos recientes */}
                <RecentExpenses expenses={recentExpenses} totalCount={gastos.length} />
            </div>

            {/* Acciones rápidas y comparación mensual */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {/* Acciones rápidas */}
                <QuickActions />

                {/* Comparación mensual */}
                <MonthlyComparison
                    lastMonthTotal={lastMonthTotal}
                    currentMonthTotal={currentMonthTotal}
                    monthlyChange={monthlyChange}
                />
                
                {/* Widget de resumen del día */}
                <DaySummary
                    todayTotal={todayTotal}
                    todayCount={todayExpenses.length}
                    yesterdayTotal={yesterdayExpenses.reduce((sum, g) => sum + g.monto, 0)}
                    hasYesterdayExpenses={yesterdayExpenses.length > 0}
                />
            </div>

            {/* Gráfico de progreso de categorías vs presupuesto */}
            <div className="mt-6">
                <BudgetCategoryProgress categories={categoryProgress} />
            </div>
        </div>
    )
}
