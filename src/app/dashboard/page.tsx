"use client"

import React, { useMemo, useState, useEffect } from "react"
import { useGastosFiltrados } from "@/hooks/useGastosFiltrados"
import { format, startOfMonth, endOfMonth, isToday, isYesterday, subMonths } from "date-fns"
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
import { buildMonthPlan } from "@/lib/month-planning"
import type { PlanningRule } from "@/lib/month-planning"
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
    const currentMonth = startOfMonth(currentDate)
    const currentMonthEnd = endOfMonth(currentDate)
    const lastMonth = startOfMonth(subMonths(currentDate, 1))
    const lastMonthEnd = endOfMonth(subMonths(currentDate, 1))
    const today = format(currentDate, 'yyyy-MM-dd')
    const monthKey = today.slice(0, 7)
    const [budgetTotal, setBudgetTotal] = useState<number | undefined>(undefined)
    const [budgetCategories, setBudgetCategories] = useState<any[]>([])
    const [rules, setRules] = useState<PlanningRule[]>([])
    const [recurringLinks, setRecurringLinks] = useState<Record<number, number>>({})
    const [planLoading, setPlanLoading] = useState(true)
    const [planError, setPlanError] = useState<string | null>(null)
    const [retry, setRetry] = useState(0)

    useEffect(() => {
        const controller = new AbortController()
        async function loadPlan() {
            setPlanLoading(true)
            setPlanError(null)
            setBudgetTotal(undefined)
            setBudgetCategories([])
            setRules([])
            setRecurringLinks({})
            try {
                const read = async (url: string) => {
                    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' })
                    if (!response.ok) throw new Error('No se pudo cargar el plan del mes. Verifica el presupuesto y la migración de recurrentes e intenta de nuevo.')
                    return response.json()
                }
                const [budgets, recurring] = await Promise.all([
                    read(`/api/presupuestos?anio=${currentDate.getFullYear()}`),
                    read(`/api/dashboard/recurring-plan?month=${monthKey}`),
                ])
                if (!Array.isArray(budgets) || !Array.isArray(recurring.rules) || !Array.isArray(recurring.links)) throw new Error('La respuesta del plan del mes no es válida.')
                const budget = budgets.find((b: any) => Number(b.mes) === currentDate.getMonth() + 1 && Number(b.anio) === currentDate.getFullYear())
                const categories = budget ? await read(`/api/presupuesto-mensual-detalle?presupuesto_mensual_id=${budget.id}`) : []
                if (!Array.isArray(categories) || (budget && !Number.isFinite(Number(budget.total)))) throw new Error('El presupuesto del mes no es válido.')
                if (controller.signal.aborted) return
                setBudgetTotal(budget ? Number(budget.total) : undefined)
                setBudgetCategories(categories)
                setRules(recurring.rules)
                setRecurringLinks(Object.fromEntries(recurring.links.map((link: { id: number; gasto_recurrente_id: number }) => [link.id, link.gasto_recurrente_id])))
            } catch (error) {
                if (!controller.signal.aborted) setPlanError(error instanceof Error ? error.message : 'No se pudo cargar el plan del mes.')
            } finally {
                if (!controller.signal.aborted) setPlanLoading(false)
            }
        }
        loadPlan()
        return () => controller.abort()
    }, [currentDate, monthKey, retry])

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

    const ayerTotal = yesterdayExpenses.reduce((sum, g) => sum + g.monto, 0)

    // Proyeccion de cierre: mismo criterio que en Estadisticas (ritmo diario
    // sobre los dias ya transcurridos, extrapolado al mes completo).
    const diasTranscurridos = differenceInCalendarDays(currentDate, currentMonth) + 1
    const ritmoDiario = diasTranscurridos > 0 ? currentMonthTotal / diasTranscurridos : 0
    const proyeccionMes = ritmoDiario * getDaysInMonth(currentDate)

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
                    onRetry={() => setRetry(value => value + 1)} />

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
