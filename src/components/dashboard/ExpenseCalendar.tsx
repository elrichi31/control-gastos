"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, isToday, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { useMemo } from "react"
import { toDateWithTime, formatMoney } from "@/lib/utils"
import { Gasto } from "@/types"

interface ExpenseCalendarProps {
  currentDate: Date
  expenses: Gasto[]
}

export function ExpenseCalendar({ currentDate, expenses }: ExpenseCalendarProps) {
  const currentMonth = startOfMonth(currentDate)
  const currentMonthEnd = endOfMonth(currentDate)

  const { dias, maximo } = useMemo(() => {
    const daysInMonth = eachDayOfInterval({ start: currentMonth, end: currentMonthEnd })

    const monthExpenses = expenses.filter(g => {
      const fecha = toDateWithTime(g.fecha)
      return fecha >= currentMonth && fecha <= currentMonthEnd
    })

    const dias = daysInMonth.map(day => {
      const dayExpenses = monthExpenses.filter(g => isSameDay(toDateWithTime(g.fecha), day))
      return {
        date: day,
        total: dayExpenses.reduce((sum, g) => sum + g.monto, 0),
        count: dayExpenses.length,
      }
    })

    return { dias, maximo: Math.max(...dias.map(d => d.total), 0) }
  }, [expenses, currentMonth, currentMonthEnd])

  const weekDays = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]

  /**
   * Mapa de calor en vez de "rojo si hay gastos": la intensidad dice cuánto,
   * no solo si hubo. Cuatro escalones se distinguen mejor que un degradado.
   */
  const intensidad = (total: number) => {
    if (total === 0 || maximo === 0) return "bg-muted/40"
    const r = total / maximo
    if (r > 0.66) return "bg-chart-1/70"
    if (r > 0.33) return "bg-chart-1/45"
    return "bg-chart-1/20"
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          {format(currentDate, "MMMM yyyy", { locale: es }).replace(/^./, c => c.toUpperCase())}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {dias.filter(d => d.count > 0).length} días con gasto este mes
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-1.5">
          {weekDays.map(day => (
            <div key={day} className="text-center text-[11px] font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: getDay(currentMonth) }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {dias.map(({ date, total, count }) => {
            const esHoy = isToday(date)
            return (
              <div
                key={date.toISOString()}
                title={
                  count > 0
                    ? `${format(date, "d 'de' MMMM", { locale: es })}: ${formatMoney(total)} en ${count} ${count === 1 ? "gasto" : "gastos"}`
                    : format(date, "d 'de' MMMM", { locale: es })
                }
                className={`aspect-square rounded-md flex items-center justify-center text-xs transition-colors ${intensidad(total)} ${
                  esHoy ? "ring-1 ring-primary ring-inset font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {format(date, "d")}
              </div>
            )
          })}
        </div>

        {/* Leyenda de intensidad, como en un heatmap de contribuciones */}
        <div className="flex items-center justify-end gap-1.5 mt-4 text-[11px] text-muted-foreground">
          <span>Menos</span>
          <span className="w-3 h-3 rounded-sm bg-muted/40" />
          <span className="w-3 h-3 rounded-sm bg-chart-1/20" />
          <span className="w-3 h-3 rounded-sm bg-chart-1/45" />
          <span className="w-3 h-3 rounded-sm bg-chart-1/70" />
          <span>Más</span>
        </div>
      </CardContent>
    </Card>
  )
}
