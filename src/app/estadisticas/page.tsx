"use client"

import React, { useState, useMemo } from "react"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGastosFiltrados } from "@/hooks/useGastosFiltrados"
import { format } from "date-fns"

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

export default function EstadisticasPage() {
    const [selectedYear, setSelectedYear] = useState(currentYear)
    const [selectedMonth, setSelectedMonth] = useState(currentMonth)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [allTime, setAllTime] = useState(false)

    const { gastos, loading } = useGastosFiltrados()

    // Filtrar gastos por año, mes y rango de fechas o todo el tiempo
    const filteredGastos = useMemo(() => {
        return gastos.filter(g => {
            const fecha = /^\d{4}-\d{2}-\d{2}$/.test(g.fecha)
                ? new Date(g.fecha + "T00:00:00")
                : new Date(g.fecha)
            const matchesYear = allTime ? true : (selectedYear ? fecha.getFullYear() === selectedYear : true)
            const matchesMonth = allTime ? true : (selectedMonth ? fecha.getMonth() + 1 === selectedMonth : true)
            const matchesStart = startDate ? fecha >= new Date(startDate) : true
            const matchesEnd = endDate ? fecha <= new Date(endDate) : true
            return matchesYear && matchesMonth && matchesStart && matchesEnd
        })
    }, [gastos, selectedYear, selectedMonth, startDate, endDate, allTime])

    // Agrupar por categoría para el gráfico
    const pieData = useMemo(() => {
        const result: Record<string, { nombre: string; total: number }> = {}
        filteredGastos.forEach(g => {
            if (!result[g.categoria_id]) {
                result[g.categoria_id] = { nombre: g.categoria.nombre, total: 0 }
            }
            result[g.categoria_id].total += g.monto
        })
        return result
    }, [filteredGastos])

    // Agrupar por mes para el AreaChart (toda la data, sin filtros)
    const monthlyData = useMemo(() => {
        const result: { name: string; value: number }[] = []
        for (let i = 0; i < 12; i++) {
            const monthGastos = gastos.filter(g => {
                const fecha = /^\d{4}-\d{2}-\d{2}$/.test(g.fecha)
                    ? new Date(g.fecha + "T00:00:00")
                    : new Date(g.fecha)
                return fecha.getMonth() === i
            })
            result.push({
                name: months[i],
                value: monthGastos.reduce((sum, g) => sum + (typeof g.monto === "string" ? parseFloat(g.monto) : g.monto || 0), 0)
            })
        }
        return result
    }, [gastos])

    // Datos para RadarChart por categoría
    const radarData = useMemo(() => {
        return Object.entries(pieData).map(([id, d]) => ({ category: d.nombre, value: d.total }))
    }, [pieData])

    return (
        <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Estadísticas</h1>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full">
                    {/* Widgets - ocupan 3 columnas en desktop */}
                    <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 gap-4">
                        {/* Widget de total gastado */}
                        <Card className="h-[110px] bg-green-50 border-green-200 shadow">
                            <CardContent className="py-5 text-center flex flex-col justify-center h-full">
                                <span className="block text-sm text-green-700 mb-1">Total gastado</span>
                                <span className="text-lg font-bold text-green-700">
                                    ${filteredGastos.reduce((sum, g) => sum + (typeof g.monto === "string" ? parseFloat(g.monto) : g.monto || 0), 0).toFixed(2)}
                                </span>
                            </CardContent>
                        </Card>
                        {/* Widget de promedio por categoría */}
                        <Card className="h-[110px] bg-yellow-50 border-yellow-200 shadow-sm">
                            <CardContent className="py-4 text-center flex flex-col justify-center h-full">
                                <span className="block text-sm text-yellow-700 mb-1">Promedio por categoría</span>
                                <span className="text-lg font-bold text-yellow-700">
                                    ${Object.values(pieData).length > 0 ? (Object.values(pieData).reduce((sum, d) => sum + d.total, 0) / Object.values(pieData).length).toFixed(2) : "0.00"}
                                </span>
                            </CardContent>
                        </Card>
                        <Card className="h-[110px] bg-purple-50 border-purple-200 shadow-sm">
                            <CardContent className="py-2 text-center flex flex-col justify-center h-full">
                                <span className="block text-sm text-purple-700 mb-1">Total de transacciones</span>
                                <span className="text-lg font-bold text-purple-700">
                                    {gastos.length}
                                </span>
                            </CardContent>
                        </Card>
                    </div>
                    {/* Filtros - ocupan 4 columnas en desktop */}
                    <div className="md:col-span-4">
                        <Card className="h-full bg-white shadow-sm">
                            <CardContent className="py-4">
                                <div className="flex flex-col gap-2">
                                    <label className="block text-sm font-medium">Filtrar por</label>
                                    <select
                                        className="border rounded px-2 py-1 w-full"
                                        value={allTime ? "all" : "periodo"}
                                        onChange={e => setAllTime(e.target.value === "all")}
                                    >
                                        <option value="periodo">Año y mes</option>
                                        <option value="all">Todo el tiempo</option>
                                    </select>
                                    {!allTime && (
                                        <>
                                            <label className="block text-sm font-medium">Año</label>
                                            <select
                                                className="border rounded px-2 py-1 w-full"
                                                value={selectedYear}
                                                onChange={e => setSelectedYear(Number(e.target.value))}
                                            >
                                                {years.map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                            <label className="block text-sm font-medium">Mes</label>
                                            <select
                                                className="border rounded px-2 py-1 w-full"
                                                value={selectedMonth}
                                                onChange={e => setSelectedMonth(Number(e.target.value))}
                                            >
                                                {months.map((m, i) => (
                                                    <option key={m} value={i + 1}>{m}</option>
                                                ))}
                                            </select>
                                        </>
                                    )}
                                    <label className="block text-sm font-medium">Desde</label>
                                    <input
                                        type="date"
                                        className="border rounded px-2 py-1 w-full"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                    />
                                    <label className="block text-sm font-medium">Hasta</label>
                                    <input
                                        type="date"
                                        className="border rounded px-2 py-1 w-full"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    {/* Radar Chart - ocupan 5 columnas en desktop */}
                    <div className="md:col-span-5">
                        <Card className="h-full bg-white rounded-lg shadow-sm">
                            <CardContent className="p-4 flex flex-col items-center h-full">
                                <h2 className="text-lg font-semibold mb-4">Radar de categorías</h2>
                                {loading ? (
                                    <div className="text-center py-8">Cargando datos...</div>
                                ) : radarData.length === 0 ? (
                                    <div className="text-center py-8">No hay datos para mostrar.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RadarChart cx="50%" cy="50%" outerRadius={100} data={radarData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="category" fontSize={12} />
                                            <PolarRadiusAxis fontSize={10} />
                                            <Radar name="Gasto" dataKey="value" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.6} />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* PieChart */}
                <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center">
                    <h2 className="text-lg font-semibold mb-4">Distribución por categoría</h2>
                    {loading ? (
                        <div className="text-center py-8">Cargando datos...</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={Object.entries(pieData).map(([id, d]) => ({ name: d.nombre, value: d.total }))}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {Object.entries(pieData).map(([id], idx) => (
                                        <Cell key={id} fill={["#38bdf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#f472b6"][idx % 6]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
                {/* BarChart */}
                <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center">
                    <h2 className="text-lg font-semibold mb-4">Gasto por categoría</h2>
                    {loading ? (
                        <div className="text-center py-8">Cargando datos...</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={Object.entries(pieData).map(([id, d]) => ({ name: d.nombre, value: d.total }))}
                            >
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" fill="#38bdf8" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
                {/* AreaChart: Gasto mensual */}
                <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center md:col-span-2">
                    <h2 className="text-lg font-semibold mb-4">Gasto mensual</h2>
                    {loading ? (
                        <div className="text-center py-8">Cargando datos...</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="value" stroke="#38bdf8" fillOpacity={1} fill="url(#colorGasto)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    )
}
