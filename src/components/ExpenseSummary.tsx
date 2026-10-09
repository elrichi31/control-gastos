"use client"

import { useState, useEffect, useId } from "react"
import { ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Expense } from "@/types"

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
            from: firstDay.toISOString().slice(0, 10),
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

    const total = expenses.reduce((sum, e) => sum + e.monto, 0)
    const filterId = useId()
    const displayDate = (date: string) => date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3/$2/$1")
    const periodLabel = dateRange.from && dateRange.to
        ? `${displayDate(dateRange.from)} al ${displayDate(dateRange.to)}`
        : dateRange.from ? `Desde ${displayDate(dateRange.from)}`
        : dateRange.to ? `Hasta ${displayDate(dateRange.to)}` : "Todas las fechas"

    return (
        <Card className="bg-card border-border">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Resumen</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Total de gastos</p>
                        <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums mt-0.5">
                            ${total.toFixed(2)}
                        </p>
                        <p aria-label="Período del resumen" className="text-xs text-muted-foreground mt-1">{periodLabel}</p>
                        <p className="text-xs text-muted-foreground mt-1">{expenses.length} gastos filtrados</p>
                    </div>
                    <details className="group border-t border-border pt-1">
                        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                            Filtrar y agrupar
                            <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" />
                        </summary>
                        <div className="space-y-3 pt-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                                <div className="min-w-0 space-y-1">
                                    <Label htmlFor={`${filterId}-from`} className="text-xs text-muted-foreground">Desde</Label>
                                    <Input
                                        id={`${filterId}-from`}
                                        type="date"
                                        value={dateRange.from}
                                        onChange={(e) => handleRangeChange({ ...dateRange, from: e.target.value })}
                                        className="min-w-0 bg-muted border-border dark:[color-scheme:dark]"
                                    />
                                </div>
                                <div className="min-w-0 space-y-1">
                                    <Label htmlFor={`${filterId}-to`} className="text-xs text-muted-foreground">Hasta</Label>
                                    <Input
                                        id={`${filterId}-to`}
                                        type="date"
                                        value={dateRange.to}
                                        onChange={(e) => handleRangeChange({ ...dateRange, to: e.target.value })}
                                        className="min-w-0 bg-muted border-border dark:[color-scheme:dark]"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor={`${filterId}-group`} className="text-xs text-muted-foreground">Agrupar por</Label>
                                <Select value={groupBy} onValueChange={(val) => handleGroupByChange(val as "dia" | "semana" | "mes")}>
                                    <SelectTrigger id={`${filterId}-group`} className="w-[120px] h-8 text-sm bg-muted border-border">
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
                                <Button onClick={clearFilters} variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                                    Limpiar filtros
                                </Button>
                            )}
                        </div>
                    </details>
                </div>
            </CardContent>
        </Card>
    )
}
