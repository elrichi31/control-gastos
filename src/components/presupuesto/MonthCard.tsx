import { Calendar, TrendingUp, TrendingDown, X, Eye, Wallet, Receipt } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface MonthCardProps {
  month: {
    name: string
    value: string
    number: number
  }
  data: {
    total: number
    expenses: number
    status: "completed" | "in-progress" | "pending"
    trend: "up" | "down" | "stable"
    previousMonth: number,
    id: number
  }
  isCurrentMonth: boolean
  onRemove: (monthValue: string) => void
}

const getMonthAbbr = (monthName: string) => {
  const abbrs: { [key: string]: string } = {
    'Enero': 'ENE',
    'Febrero': 'FEB',
    'Marzo': 'MAR',
    'Abril': 'ABR',
    'Mayo': 'MAY',
    'Junio': 'JUN',
    'Julio': 'JUL',
    'Agosto': 'AGO',
    'Septiembre': 'SEP',
    'Octubre': 'OCT',
    'Noviembre': 'NOV',
    'Diciembre': 'DIC'
  }
  return abbrs[monthName] || monthName.slice(0, 3).toUpperCase()
}

export function MonthCard({ month, data, isCurrentMonth, onRemove }: MonthCardProps) {
  const hasData = data.expenses > 0
  const trendPercentage = data.previousMonth > 0 
    ? Math.round(((data.total - data.previousMonth) / data.previousMonth) * 100) 
    : 0

  const averageExpense = data.expenses > 0 ? data.total / data.expenses : 0

  return (
    <Card className={`group relative border-0 hover:shadow-lg transition-all duration-200 ${
      isCurrentMonth 
        ? "bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-md" 
        : "bg-white hover:shadow-xl border border-gray-100"
    }`}>
      
      <CardContent className="p-4">
        {/* Header compacto */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
              isCurrentMonth 
                ? "bg-blue-500 text-white shadow-sm" 
                : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 border border-slate-300"
            }`}>
              {getMonthAbbr(month.name)}
            </div>
            <div>
              <h3 className={`font-semibold text-sm ${
                isCurrentMonth ? "text-blue-900" : "text-gray-900"
              }`}>
                {month.name}
              </h3>
              {isCurrentMonth && (
                <Badge className="bg-blue-500 text-white text-xs shadow-sm">
                  Actual
                </Badge>
              )}
            </div>
          </div>
          
          {!hasData && !isCurrentMonth && (
            <button
              className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-all"
              onClick={() => onRemove(month.value)}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Métricas compactas */}
        <div className="space-y-3 mb-4">
          {/* Total y tendencia en una línea */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className={`w-4 h-4 ${isCurrentMonth ? "text-blue-600" : "text-emerald-500"}`} />
              <span className={`text-xl font-bold ${isCurrentMonth ? "text-blue-900" : "text-gray-900"}`}>
                ${data.total.toLocaleString()}
              </span>
            </div>
            
            {data.total > 0 && data.previousMonth > 0 && (
              <div className="flex items-center gap-1">
                {data.trend === "up" ? (
                  <TrendingUp className="w-3 h-3 text-red-500" />
                ) : data.trend === "down" ? (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                ) : null}
                <span className={`text-xs font-medium ${
                  isCurrentMonth 
                    ? "text-blue-700" 
                    : data.trend === "up" ? "text-red-500" : 
                      data.trend === "down" ? "text-green-500" : "text-gray-500"
                }`}>
                  {trendPercentage > 0 ? "+" : ""}{trendPercentage}%
                </span>
              </div>
            )}
          </div>

          {/* Gastos y promedio */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className={`flex items-center gap-1 ${isCurrentMonth ? "text-blue-700" : "text-gray-600"}`}>
              <Receipt className={`w-3 h-3 ${isCurrentMonth ? "text-blue-600" : "text-purple-500"}`} />
              <span>{data.expenses} gastos</span>
            </div>
            <div className={`text-right ${isCurrentMonth ? "text-blue-700" : "text-gray-600"}`}>
              <span>Promedio: <span className={isCurrentMonth ? "text-blue-800" : "text-orange-600"}>${averageExpense.toFixed(0)}</span></span>
            </div>
          </div>
        </div>

        {/* Botón compacto */}
        <Link href={`/presupuesto/${data.id}?mes=${encodeURIComponent(month.name)}`}>
          <Button 
            className={`w-full h-8 text-xs font-medium transition-all duration-200 ${
              isCurrentMonth 
                ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm" 
                : "bg-gradient-to-r from-slate-50 to-slate-100 hover:from-blue-50 hover:to-blue-100 text-gray-700 border border-slate-200 hover:border-blue-300 hover:text-blue-700"
            }`}
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver detalles
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
