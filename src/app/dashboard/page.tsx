"use client"

import React, { useMemo } from "react"
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
  DaySummary
} from "@/components/dashboard"

const currentDate = new Date()
const currentMonth = startOfMonth(currentDate)
const currentMonthEnd = endOfMonth(currentDate)
const lastMonth = startOfMonth(subMonths(currentDate, 1))
const lastMonthEnd = endOfMonth(subMonths(currentDate, 1))

export default function DashboardPage() {
    const { gastos, loading } = useGastosFiltrados()

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
        </div>
    )
}
