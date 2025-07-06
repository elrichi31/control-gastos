"use client"

import { useState } from "react"
import { Calendar, TrendingUp, TrendingDown, CheckCircle, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb } from "@/components/Breadcrumb"

const months = [
  { name: "Enero", value: "enero", number: 1 },
  { name: "Febrero", value: "febrero", number: 2 },
  { name: "Marzo", value: "marzo", number: 3 },
  { name: "Abril", value: "abril", number: 4 },
  { name: "Mayo", value: "mayo", number: 5 },
  { name: "Junio", value: "junio", number: 6 },
  { name: "Julio", value: "julio", number: 7 },
  { name: "Agosto", value: "agosto", number: 8 },
  { name: "Septiembre", value: "septiembre", number: 9 },
  { name: "Octubre", value: "octubre", number: 10 },
  { name: "Noviembre", value: "noviembre", number: 11 },
  { name: "Diciembre", value: "diciembre", number: 12 },
]

// Datos simulados más detallados
const monthlyData: Record<
  string,
  {
    total: number
    expenses: number
    status: "completed" | "in-progress" | "pending"
    trend: "up" | "down" | "stable"
    previousMonth: number
  }
> = {
  enero: { total: 1233, expenses: 12, status: "completed", trend: "up", previousMonth: 1100 },
  febrero: { total: 1456, expenses: 15, status: "completed", trend: "up", previousMonth: 1233 },
  marzo: { total: 1122, expenses: 8, status: "completed", trend: "down", previousMonth: 1456 },
  abril: { total: 1678, expenses: 18, status: "completed", trend: "up", previousMonth: 1122 },
  mayo: { total: 1344, expenses: 14, status: "completed", trend: "down", previousMonth: 1678 },
  junio: { total: 1567, expenses: 16, status: "in-progress", trend: "up", previousMonth: 1344 },
  julio: { total: 0, expenses: 0, status: "pending", trend: "stable", previousMonth: 1567 },
  agosto: { total: 0, expenses: 0, status: "pending", trend: "stable", previousMonth: 0 },
  septiembre: { total: 0, expenses: 0, status: "pending", trend: "stable", previousMonth: 0 },
  octubre: { total: 0, expenses: 0, status: "pending", trend: "stable", previousMonth: 0 },
  noviembre: { total: 0, expenses: 0, status: "pending", trend: "stable", previousMonth: 0 },
  diciembre: { total: 0, expenses: 0, status: "pending", trend: "stable", previousMonth: 0 },
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
      return "Completado"
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

export default function HomePage() {
  const [selectedYear, setSelectedYear] = useState("2025")
  const currentMonth = new Date().getMonth() + 1

  return (
    <div className="p-4 lg:p-8">
      <Breadcrumb items={[{ label: "Presupuesto" }]} large />

      <div className="mb-8 mt-8">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Año</label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full sm:w-48 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 max-w-none lg:max-w-6xl">
        {months.map((month) => {
          const data = monthlyData[month.value]
          const isCurrentMonth = currentMonth === month.number
          const trendPercentage =
            data.previousMonth > 0 ? Math.round(((data.total - data.previousMonth) / data.previousMonth) * 100) : 0

          return (
            <Card
              key={month.value}
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
                  {isCurrentMonth && <Badge className="bg-blue-500 text-white text-xs">Actual</Badge>}
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

                <Link href={`/presupuesto/${month.value}`}>
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm lg:text-base">
                    Ver presupuesto
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
