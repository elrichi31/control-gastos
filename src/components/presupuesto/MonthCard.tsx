import { Calendar, TrendingUp, TrendingDown, CheckCircle, Clock, AlertCircle, X } from "lucide-react"
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

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case "in-progress":
      return <Clock className="w-4 h-4 text-blue-500" />
    default:
      return <AlertCircle className="w-4 h-4 text-gray-400" />
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case "completed":
      return "Finalizado"
    case "in-progress":
      return "En progreso"
    default:
      return "Pendiente"
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800"
    case "in-progress":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-600"
  }
}

export function MonthCard({ month, data, isCurrentMonth, onRemove }: MonthCardProps) {
  const hasData = data.expenses > 0
  const trendPercentage =
    data.previousMonth > 0 ? Math.round(((data.total - data.previousMonth) / data.previousMonth) * 100) : 0

  return (
    <Card
      className={`bg-gradient-to-br from-gray-50 to-gray-100 border-0 shadow-md hover:shadow-lg transition-all duration-200 ${
        isCurrentMonth ? "ring-2 ring-blue-500 from-blue-50 to-blue-100" : ""
      }`}
    >
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar
              className={`w-5 h-5 lg:w-6 lg:h-6 ${isCurrentMonth ? "text-blue-600" : "text-gray-600"}`}
            />
            <h3
              className={`text-base lg:text-lg font-semibold ${isCurrentMonth ? "text-blue-900" : "text-gray-900"}`}
            >
              {month.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isCurrentMonth && <Badge className="bg-blue-500 text-white text-xs">Actual</Badge>}
            {!hasData && (
              <button
                className="bg-white hover:bg-gray-50 text-gray-400 hover:text-red-500 h-8 w-8 p-0 rounded-full border border-gray-200 flex items-center justify-center transition-colors"
                onClick={() => onRemove(month.value)}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2 lg:space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total:</span>
            <span className="font-bold text-base lg:text-lg text-gray-900">${data.total.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Gastos:</span>
            <span className="text-sm font-medium text-gray-700">{data.expenses} registrados</span>
          </div>

          {data.total > 0 && data.previousMonth > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tendencia:</span>
              <div className="flex items-center gap-1">
                {data.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : data.trend === "down" ? (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                ) : null}
                <span
                  className={`text-sm font-medium ${
                    data.trend === "up"
                      ? "text-red-600"
                      : data.trend === "down"
                        ? "text-green-600"
                        : "text-gray-600"
                  }`}
                >
                  {trendPercentage > 0 ? "+" : ""}
                  {trendPercentage}%
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Estado:</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(data.status)}
              <Badge className={getStatusColor(data.status)}>{getStatusText(data.status)}</Badge>
            </div>
          </div>
        </div>

        <Link href={`/presupuesto/${data.id}?mes=${encodeURIComponent(month.name)}`}>
          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm lg:text-base">
            Ver presupuesto
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
