"use client"

import React, { useMemo, useState, useEffect } from "react"
import { useGastosFiltrados } from "@/hooks/useGastosFiltrados"
import { format, startOfMonth, endOfMonth, isToday, isYesterday, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { toDateWithTime } from "@/lib/utils"
import { PageTitle } from "@/components/PageTitle"
import {
  DashboardHeader,
  ExpenseCalendar,
  RecentExpenses,
  BudgetCategoryProgress
} from "@/components/dashboard"
import { StatTile, StatTileRow } from "@/components/stats/stat-tile"
import { BudgetSummary } from "@/components/presupuesto/BudgetSummary"
import { formatMoney } from "@/lib/utils"
import { getDaysInMonth, differenceInCalendarDays } from "date-fns"

const currentDate = new Date()
const currentMonth = startOfMonth(currentDate)
const currentMonthEnd = endOfMonth(currentDate)
const lastMonth = startOfMonth(subMonths(currentDate, 1))
const lastMonthEnd = endOfMonth(subMonths(currentDate, 1))

export default function DashboardPage() {
    const { gastos, loading } = useGastosFiltrados()
    const [budgetTotal, setBudgetTotal] = useState<number | undefined>(undefined)
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

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-4">
                <div className="h-16 rounded-xl bg-card border border-border animate-pulse" />
                <div className="h-24 rounded-xl bg-card border border-border animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="h-80 rounded-xl bg-card border border-border animate-pulse" />
                    <div className="h-80 rounded-xl bg-card border border-border animate-pulse" />
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
            <PageTitle customTitle={`Dashboard - ${format(currentDate, "MMMM yyyy", { locale: es })} - BethaSpend`} />
            
            <DashboardHeader currentDate={currentDate} />

            <div className="space-y-4">
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

                {/* El bloque de presupuesto solo aparece si el mes tiene uno cargado */}
                {budgetTotal !== undefined && budgetTotal > 0 && (
                    <BudgetSummary presupuestado={budgetTotal} gastado={currentMonthTotal} />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                    <ExpenseCalendar currentDate={currentDate} expenses={currentMonthExpenses} />
                    <RecentExpenses expenses={recentExpenses} totalCount={gastos.length} />
                </div>

                <BudgetCategoryProgress categories={categoryProgress} />
            </div>
        </div>
    )
}
