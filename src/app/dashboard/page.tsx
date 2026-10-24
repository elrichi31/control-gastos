"use client"

import React, { useMemo, useState, useEffect } from "react"
import { useGastosFiltrados } from "@/hooks/useGastosFiltrados"
import { format, startOfMonth, endOfMonth, isSameDay, subDays, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { toDateWithTime } from "@/lib/utils"
import { PageShell } from "@/components/ui/page-layout"
import { PageTitle } from "@/components/layout/PageTitle"
import {
  DashboardHeader,
  ExpenseCalendar,
  RecentExpenses,
  BudgetCategoryProgress
} from "@/components/dashboard"
import { StatTile, StatTileRow } from "@/components/stats/stat-tile"
import { formatMoney } from "@/lib/utils"
import { getDaysInMonth, differenceInCalendarDays } from "date-fns"
import { MonthPlanning, MonthPlanningSummary } from "@/components/dashboard/MonthPlanning"
import { buildMonthPlan, categoryUsage } from "@/lib/month-planning"
import { useMonthPlanQuery } from "@/hooks/useMonthPlanQuery"
import { CategoryRanking } from "@/components/stats/category-ranking"
import { EmailPendingBanner } from "@/components/dashboard/EmailPendingBanner"

export default function DashboardPage() {
    const { gastos, loading, error: expensesError } = useGastosFiltrados()
    const [currentDate, setCurrentDate] = useState(() => new Date())
    // A tab left open across midnight must roll over to the new day/month.
    useEffect(() => {
        const tick = () => setCurrentDate(prev => {
            const now = new Date()
            return now.toDateString() === prev.toDateString() ? prev : now
        })
        const id = setInterval(tick, 60_000)
        document.addEventListener('visibilitychange', tick)
        return () => {
            clearInterval(id)
            document.removeEventListener('visibilitychange', tick)
        }
    }, [])
    const currentMonth = useMemo(() => startOfMonth(currentDate), [currentDate])
    const currentMonthEnd = useMemo(() => endOfMonth(currentDate), [currentDate])
    const lastMonth = useMemo(() => startOfMonth(subMonths(currentDate, 1)), [currentDate])
    const lastMonthEnd = useMemo(() => endOfMonth(subMonths(currentDate, 1)), [currentDate])
    const today = format(currentDate, 'yyyy-MM-dd')
    const monthKey = today.slice(0, 7)
    const planQuery = useMonthPlanQuery(monthKey)
    const { budgetTotal, budgetCategories = [], rules = [], recurringLinks = {} } = planQuery.data ?? {}
    const planLoading = planQuery.isPending
    const planError = planQuery.error?.message ?? null

    // Gastos del mes actual
    const currentMonthExpenses = useMemo(() => {
        return gastos.filter(g => {
            // Parsear fecha correctamente evitando problemas de zona horaria
            const fecha = toDateWithTime(g.fecha)
            return fecha >= currentMonth && fecha <= currentMonthEnd
        })
    }, [gastos, currentMonth, currentMonthEnd])

    // Gastos del mes pasado
    const lastMonthExpenses = useMemo(() => {
        return gastos.filter(g => {
            const fecha = toDateWithTime(g.fecha)
            return fecha >= lastMonth && fecha <= lastMonthEnd
        })
    }, [gastos, lastMonth, lastMonthEnd])

    // Gastos de hoy
    const todayExpenses = useMemo(() => {
        return gastos.filter(g => {
            const fecha = toDateWithTime(g.fecha)
            return isSameDay(fecha, currentDate)
        })
    }, [gastos, currentDate])

    // Gastos de ayer
    const yesterdayExpenses = useMemo(() => {
        return gastos.filter(g => {
            const fecha = toDateWithTime(g.fecha)
            return isSameDay(fecha, subDays(currentDate, 1))
        })
    }, [gastos, currentDate])

    // Últimos 5 gastos
    const recentExpenses = useMemo(() => {
        return [...gastos]
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

    const ayerTotal = yesterdayExpenses.reduce((sum, g) => sum + g.monto, 0)

    // Proyeccion de cierre: mismo criterio que en Estadisticas (ritmo diario
    // sobre los dias ya transcurridos, extrapolado al mes completo).
    const diasTranscurridos = differenceInCalendarDays(currentDate, currentMonth) + 1
    const ritmoDiario = diasTranscurridos > 0 ? currentMonthTotal / diasTranscurridos : 0
    const proyeccionMes = ritmoDiario * getDaysInMonth(currentDate)

    // Calcular progreso de categorías del presupuesto
    const categoryProgress = useMemo(() => {
        if (budgetCategories.length === 0) return []

        return categoryUsage(budgetCategories, currentMonthExpenses, monthKey).map(cat => ({
            id: cat.categoria_id,
            nombre: cat.nombre,
            icono: cat.icono || '📊',
            gastado: cat.gastado,
            presupuestado: cat.presupuestado
        }))
    }, [budgetCategories, currentMonthExpenses, monthKey])

    // Ranking por categoría del mes contra el mes anterior (mismo formato que Estadísticas).
    const categoryRanking = useMemo(() => {
        const sumBy = (list: typeof gastos) => list.reduce<Record<string, { total: number; conteo: number }>>((acc, g) => {
            const nombre = g.categoria?.nombre ?? "Sin categoría"
            acc[nombre] ??= { total: 0, conteo: 0 }
            acc[nombre].total += g.monto
            acc[nombre].conteo++
            return acc
        }, {})
        const actual = sumBy(currentMonthExpenses)
        const previo = sumBy(lastMonthExpenses)
        const categorias = Object.entries(actual)
            .map(([nombre, { total, conteo }]) => {
                const antes = previo[nombre]?.total ?? 0
                return {
                    nombre, total, conteo, previo: antes,
                    porcentaje: currentMonthTotal > 0 ? (total / currentMonthTotal) * 100 : 0,
                    delta: antes > 0 ? ((total - antes) / antes) * 100 : null,
                }
            })
            .sort((a, b) => b.total - a.total)
        return { categorias, concentracion: categorias.slice(0, 3).reduce((s, c) => s + c.porcentaje, 0) }
    }, [currentMonthExpenses, lastMonthExpenses, currentMonthTotal])

    const monthPlan = useMemo(() => buildMonthPlan({
        today,
        budget: budgetTotal,
        expenses: gastos.map(g => ({ ...g, gasto_recurrente_id: recurringLinks[g.id] })),
        rules,
        categories: categoryProgress,
    }), [today, budgetTotal, gastos, recurringLinks, rules, categoryProgress])

    if (expensesError && !loading) return (
        <PageShell><MonthPlanningSummary plan={monthPlan} loading={false}
            error="No se pudieron cargar tus gastos. No podemos calcular un disponible fiable."
            onRetry={() => window.location.reload()} /></PageShell>
    )

    if (loading) {
        return (
            <PageShell className="space-y-4">
                <div className="h-16 rounded-xl bg-card border border-border animate-pulse" />
                <div className="h-24 rounded-xl bg-card border border-border animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="h-80 rounded-xl bg-card border border-border animate-pulse" />
                    <div className="h-80 rounded-xl bg-card border border-border animate-pulse" />
                </div>
            </PageShell>
        )
    }

    return (
        <PageShell>
            <PageTitle customTitle={`Dashboard - ${format(currentDate, "MMMM yyyy", { locale: es })} - BethaSpend`} />
            
            <DashboardHeader currentDate={currentDate} />

            <div className="space-y-4">
                <EmailPendingBanner />

                {/* Misma fila de KPIs que en Estadisticas, para que ambas pantallas se lean igual */}
                <StatTileRow>
                    <StatTile
                        etiqueta="Gasto del mes"
                        valor={formatMoney(currentMonthTotal)}
                        delta={lastMonthTotal > 0 ? monthlyChangePercentage : null}
                        ayuda="sin mes anterior"
                    />
                    <StatTile
                        etiqueta="Hoy"
                        valor={formatMoney(todayTotal)}
                        delta={ayerTotal > 0 ? ((todayTotal - ayerTotal) / ayerTotal) * 100 : null}
                        ayuda={`${todayExpenses.length} ${todayExpenses.length === 1 ? "transaccion" : "transacciones"}`}
                    />
                    <StatTile
                        etiqueta="Proyeccion de cierre"
                        valor={formatMoney(proyeccionMes)}
                        delta={lastMonthTotal > 0 ? ((proyeccionMes - lastMonthTotal) / lastMonthTotal) * 100 : null}
                        ayuda={`ritmo de ${formatMoney(ritmoDiario)}/dia`}
                    />
                    <StatTile
                        etiqueta="Transacciones"
                        valor={String(currentMonthExpenses.length)}
                        delta={lastMonthExpenses.length > 0
                            ? ((currentMonthExpenses.length - lastMonthExpenses.length) / lastMonthExpenses.length) * 100
                            : null}
                        invertirColor={false}
                        ayuda="sin mes anterior"
                    />
                </StatTileRow>

                <MonthPlanningSummary plan={monthPlan} loading={planLoading} error={planError}
                    onRetry={() => void planQuery.refetch()} />

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                    <ExpenseCalendar currentDate={currentDate} expenses={currentMonthExpenses} />
                    <CategoryRanking categorias={categoryRanking.categorias} concentracion={categoryRanking.concentracion} />
                    <div className="lg:col-span-2 xl:col-span-1">
                        <RecentExpenses expenses={recentExpenses} totalCount={gastos.length} />
                    </div>
                </div>

                <MonthPlanning plan={monthPlan} loading={planLoading} error={planError} />

                <BudgetCategoryProgress categories={categoryProgress} />
            </div>
        </PageShell>
    )
}
