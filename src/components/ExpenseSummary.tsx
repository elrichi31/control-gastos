"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Expense } from "../hooks/useExpenses"

export function ExpenseSummary({
    expenses,
    onDateRangeChange,
    groupBy,
    setGroupBy
}: {
    expenses: Expense[]
    onDateRangeChange: (range: { from: string; to: string }, groupBy: "dia" | "semana" | "mes") => void
    groupBy: "dia" | "semana" | "mes"
    setGroupBy: (value: "dia" | "semana" | "mes") => void
}) {

    function getCurrentMonthRange() {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        return {
            from: firstDay.toISOString().slice(0, 10), // "YYYY-MM-DD"
            to: lastDay.toISOString().slice(0, 10)
        }
    }


    const [dateRange, setDateRange] = useState(() => getCurrentMonthRange())
    useEffect(() => {
        onDateRangeChange(getCurrentMonthRange(), groupBy)
    }, [])


    const handleRangeChange = (newRange: typeof dateRange) => {
        setDateRange(newRange)
        onDateRangeChange(newRange, groupBy)
    }

    const handleGroupByChange = (value: "dia" | "semana" | "mes") => {
        setGroupBy(value)
        onDateRangeChange(dateRange, value)
    }


    const clearFilters = () => {
        const clearedRange = { from: "", to: "" }
        setDateRange(clearedRange)
        onDateRangeChange(clearedRange, groupBy)
    }

    const total = expenses.reduce((sum, e) => sum + e.amount, 0)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Resumen</CardTitle>
                <CardDescription>Filtra y revisa tus gastos totales en un rango de fechas</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Filtrar por fechas</label>

                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Desde</Label>
                                <Input
                                    type="date"
                                    value={dateRange.from}
                                    onChange={(e) => handleRangeChange({ ...dateRange, from: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Hasta</Label>
                                <Input
                                    type="date"
                                    value={dateRange.to}
                                    onChange={(e) => handleRangeChange({ ...dateRange, to: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-xs text-gray-500">Agrupar por</Label>
                            <Select value={groupBy} onValueChange={(val) => handleGroupByChange(val as "dia" | "semana" | "mes")}>
                                <SelectTrigger className="w-[120px] h-8 text-sm">
                                    <SelectValue placeholder="Agrupar por" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dia">Día</SelectItem>
                                    <SelectItem value="semana">Semana</SelectItem>
                                    <SelectItem value="mes">Mes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>


                        {(dateRange.from || dateRange.to) && (
                            <Button
                                onClick={clearFilters}
                                variant="ghost"
                                size="sm"
                                className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                            >
                                Limpiar filtros
                            </Button>
                        )}
                    </div>

                    <div className="text-center border-t pt-3">
                        <p className="text-sm text-gray-600">Total de gastos</p>
                        <p className="text-3xl font-bold text-red-600">${total.toFixed(2)}</p>
                        <p className="text-sm text-gray-600 mt-1">{expenses.length} gastos filtrados</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
