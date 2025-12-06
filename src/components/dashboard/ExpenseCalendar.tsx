"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
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

  const dailyExpenses = useMemo(() => {
    const daysInMonth = eachDayOfInterval({ start: currentMonth, end: currentMonthEnd })
    
    // Filter expenses for current month
    const monthExpenses = expenses.filter(g => {
      const fecha = toDateWithTime(g.fecha)
      return fecha >= currentMonth && fecha <= currentMonthEnd
    })

    return daysInMonth.map(day => {
      const dayExpenses = monthExpenses.filter(g => {
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
  }, [expenses, currentMonth, currentMonthEnd])

  const weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

  return (
    <Card className="dark:bg-neutral-900 dark:border-neutral-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Calendar className="w-5 h-5" />
          Calendario de Gastos - {format(currentDate, "MMMM yyyy", { locale: es })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-3">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 p-1 sm:p-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Grid del calendario */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Espacios vacíos para los días anteriores al inicio del mes */}
          {Array.from({ length: getDay(currentMonth) }).map((_, index) => (
            <div key={`empty-${index}`} className="h-12 sm:h-16"></div>
          ))}
          
          {/* Días del mes */}
          {dailyExpenses.map(({ date, total }) => {
            const dayNumber = format(date, 'd')
            const isCurrentDay = isToday(date)
            const hasExpenses = total > 0
            
            return (
              <div
                key={date.toISOString()}
                className={`
                  h-12 sm:h-16 p-1 sm:p-2 rounded-lg text-center text-xs sm:text-sm cursor-pointer transition-colors flex flex-col justify-center
                  ${isCurrentDay 
                    ? 'bg-blue-100 dark:bg-neutral-900 border border-blue-500 dark:border-neutral-600 sm:border-2' 
                    : hasExpenses 
                      ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800' 
                      : 'bg-gray-50 dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-800'
                  }
                `}
              >
                <div className={`font-medium leading-none ${isCurrentDay ? 'text-blue-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}>
                  {dayNumber}
                </div>
                {hasExpenses && (
                  <div className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-medium leading-tight mt-0.5 sm:mt-1">
                    {total > 999 ? formatMoney(Math.round(total/1000) * 1000).replace('.00', '') + 'k' : formatMoney(total)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Leyenda */}
        <div className="mt-4 flex justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 dark:bg-neutral-900 border border-blue-500 dark:border-neutral-600 rounded"></div>
            <span>Hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded"></div>
            <span>Días con gastos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
