"use client"

import { formatMoney } from "@/lib/utils"

import { useState, useEffect, useId } from "react"
import { ChevronDown } from "lucide-react"
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
        <section aria-label="Resumen de actividad" className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de gastos</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground tabular-nums">{formatMoney(total)}</p>
                </div>
                <p className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">{expenses.length} gastos filtrados</p>
            </div>
            <p aria-label="Período del resumen" className="mt-1 text-xs text-muted-foreground">{periodLabel}</p>
            <details className="group mt-3 border-t border-border pt-1">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                    Filtrar y agrupar
                    <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" />
                </summary>
                <div className="grid items-end gap-3 pb-2 pt-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem_auto]">
                    <div className="min-w-0 space-y-1.5">
                        <Label htmlFor={`${filterId}-from`} className="text-xs text-muted-foreground">Desde</Label>
                        <Input controlSize="form" id={`${filterId}-from`} type="date" value={dateRange.from} onChange={e => handleRangeChange({ ...dateRange, from: e.target.value })} className="min-w-0 dark:[color-scheme:dark]" />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                        <Label htmlFor={`${filterId}-to`} className="text-xs text-muted-foreground">Hasta</Label>
                        <Input controlSize="form" id={`${filterId}-to`} type="date" value={dateRange.to} onChange={e => handleRangeChange({ ...dateRange, to: e.target.value })} className="min-w-0 dark:[color-scheme:dark]" />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                        <Label htmlFor={`${filterId}-group`} className="text-xs text-muted-foreground">Agrupar por</Label>
                        <Select value={groupBy} onValueChange={val => handleGroupByChange(val as "dia" | "semana" | "mes")}>
                            <SelectTrigger id={`${filterId}-group`} className="h-11"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="dia">Día</SelectItem><SelectItem value="semana">Semana</SelectItem><SelectItem value="mes">Mes</SelectItem></SelectContent>
                        </Select>
                    </div>
                    {(dateRange.from || dateRange.to) && <Button type="button" onClick={clearFilters} variant="ghost" size="form" className="text-xs text-muted-foreground">Limpiar filtros</Button>}
                </div>
            </details>
        </section>
    )
}
