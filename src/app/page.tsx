"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGastosFiltrados } from "@/hooks/useGastosFiltrados"
import { format, startOfMonth, endOfMonth, isToday, isYesterday, subMonths, eachDayOfInterval, isSameDay, getDay } from "date-fns"
import { es } from "date-fns/locale"
import { toDateWithTime, formatDateWithLocale } from "@/lib/dateUtils"
import { PageTitle } from "@/components/PageTitle"
import Link from "next/link"
import { 
  PlusCircle, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  DollarSign,
  ShoppingCart,
  Home as HomeIcon,
  AlertTriangle,
  Clock
} from "lucide-react"

const currentDate = new Date()
const currentMonth = startOfMonth(currentDate)
const currentMonthEnd = endOfMonth(currentDate)
const lastMonth = startOfMonth(subMonths(currentDate, 1))
const lastMonthEnd = endOfMonth(subMonths(currentDate, 1))

export default function HomePage() {
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

    // Gastos por día del mes actual
    const dailyExpenses = useMemo(() => {
        const daysInMonth = eachDayOfInterval({ start: currentMonth, end: currentMonthEnd })
        return daysInMonth.map(day => {
            const dayExpenses = currentMonthExpenses.filter(g => {
                const fecha = toDateWithTime(g.fecha)
                return isSameDay(fecha, day)
            })
            const totalDay = dayExpenses.reduce((sum, g) => sum + g.monto, 0)
            return {
                date: day,
                total: totalDay,
                count: dayExpenses.length
            }
        })
    }, [currentMonthExpenses, currentMonth, currentMonthEnd])

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
            <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
            <PageTitle customTitle={`Dashboard - ${format(currentDate, "MMMM yyyy", { locale: es })} - Control de Gastos`} />
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                            ¡Hola! 👋
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                    </div>
                    <Link href="/form">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Agregar Gasto
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Cards de resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                {/* Gasto del mes */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-600 text-sm font-medium">Este mes</p>
                                <p className="text-2xl font-bold text-blue-900">
                                    ${currentMonthTotal.toLocaleString()}
                                </p>
                                <div className="flex items-center mt-2">
                                    {monthlyChange >= 0 ? (
                                        <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                                    ) : (
                                        <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                                    )}
                                    <span className={`text-sm ${monthlyChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {Math.abs(monthlyChangePercentage).toFixed(1)}% vs mes anterior
                                    </span>
                                </div>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* Gasto de hoy */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-600 text-sm font-medium">Hoy</p>
                                <p className="text-2xl font-bold text-green-900">
                                    ${todayTotal.toLocaleString()}
                                </p>
                                <p className="text-sm text-green-600 mt-2">
                                    {todayExpenses.length} transacción{todayExpenses.length !== 1 ? 'es' : ''}
                                </p>
                            </div>
                            <Calendar className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* Categoría principal */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-600 text-sm font-medium">Categoría principal</p>
                                <p className="text-lg font-bold text-purple-900 truncate">
                                    {topCategory.name}
                                </p>
                                <p className="text-sm text-purple-600 mt-2">
                                    ${topCategory.total.toLocaleString()}
                                </p>
                            </div>
                            <ShoppingCart className="w-8 h-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* Total de gastos */}
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-600 text-sm font-medium">Total de gastos</p>
                                <p className="text-2xl font-bold text-orange-900">
                                    {gastos.length}
                                </p>
                                <p className="text-sm text-orange-600 mt-2">
                                    {currentMonthExpenses.length} este mes
                                </p>
                            </div>
                            <CreditCard className="w-8 h-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendario mensual */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Calendario de Gastos - {format(currentDate, "MMMM yyyy", { locale: es })}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Días de la semana */}
                            <div className="grid grid-cols-7 gap-2 mb-3">
                                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                                    <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Grid del calendario */}
                            <div className="grid grid-cols-7 gap-2">
                                {/* Espacios vacíos para los días anteriores al inicio del mes */}
                                {Array.from({ length: getDay(currentMonth) }).map((_, index) => (
                                    <div key={`empty-${index}`} className="h-16"></div>
                                ))}
                                
                                {/* Días del mes */}
                                {dailyExpenses.map(({ date, total, count }) => {
                                    const dayNumber = format(date, 'd')
                                    const isCurrentDay = isToday(date)
                                    const hasExpenses = total > 0
                                    
                                    return (
                                        <div
                                            key={date.toISOString()}
                                            className={`
                                                h-16 p-2 rounded-lg text-center text-sm cursor-pointer transition-colors flex flex-col justify-center
                                                ${isCurrentDay 
                                                    ? 'bg-blue-100 border-2 border-blue-500' 
                                                    : hasExpenses 
                                                        ? 'bg-red-50 hover:bg-red-100 border border-red-200' 
                                                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                                }
                                            `}
                                        >
                                            <div className={`font-medium ${isCurrentDay ? 'text-blue-700' : 'text-gray-900'}`}>
                                                {dayNumber}
                                            </div>
                                            {hasExpenses && (
                                                <div className="text-xs text-red-600 font-medium leading-tight mt-1">
                                                    ${total > 999 ? Math.round(total/1000) + 'k' : total.toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            
                            {/* Leyenda */}
                            <div className="mt-4 flex justify-center gap-6 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded"></div>
                                    <span>Hoy</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
                                    <span>Días con gastos</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Gastos recientes */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Gastos Recientes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentExpenses.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No hay gastos registrados</p>
                                    <Link href="/form">
                                        <Button variant="outline" className="mt-4">
                                            Agregar tu primer gasto
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentExpenses.map((gasto) => (
                                        <div key={gasto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded-full">
                                                    <DollarSign className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 truncate max-w-[200px]">
                                                        {gasto.descripcion}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {gasto.categoria.nombre} • {formatDateWithLocale(gasto.fecha, "d MMM")}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-gray-900">
                                                ${gasto.monto.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                    {gastos.length > 6 && (
                                        <div className="text-center pt-4">
                                            <Link href="/estadisticas">
                                                <Button variant="outline">
                                                    Ver todos los gastos
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Acciones rápidas y comparación mensual */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {/* Acciones rápidas */}
                <Card>
                    <CardHeader>
                        <CardTitle>Acciones Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/form" className="block">
                            <Button variant="outline" className="w-full justify-start">
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Nuevo Gasto
                            </Button>
                        </Link>
                        <Link href="/estadisticas" className="block">
                            <Button variant="outline" className="w-full justify-start">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Ver Estadísticas
                            </Button>
                        </Link>
                        <Link href="/presupuesto" className="block">
                            <Button variant="outline" className="w-full justify-start">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Gestionar Presupuesto
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Comparación mensual */}
                {lastMonthTotal > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Comparación Mensual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Mes anterior</span>
                                    <span className="font-medium">${lastMonthTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Este mes</span>
                                    <span className="font-medium">${currentMonthTotal.toLocaleString()}</span>
                                </div>
                                <hr />
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">Diferencia</span>
                                    <span className={`font-bold ${monthlyChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {monthlyChange >= 0 ? '+' : ''}${monthlyChange.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
                
                {/* Widget de resumen del día */}
                <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                    <CardHeader>
                        <CardTitle className="text-base text-indigo-700">Resumen del Día</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-indigo-600">Gastos hoy</span>
                                <span className="font-bold text-indigo-900">${todayTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-indigo-600">Transacciones</span>
                                <span className="font-medium text-indigo-900">{todayExpenses.length}</span>
                            </div>
                            {yesterdayExpenses.length > 0 && (
                                <>
                                    <hr className="border-indigo-200" />
                                    <div className="flex justify-between">
                                        <span className="text-sm text-indigo-600">Ayer gastaste</span>
                                        <span className="font-medium text-indigo-900">
                                            ${yesterdayExpenses.reduce((sum, g) => sum + g.monto, 0).toLocaleString()}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
