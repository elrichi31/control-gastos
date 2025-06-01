"use client"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Target, TrendingUp } from "lucide-react"

export function BudgetHeader({ forecastMonth, setForecastMonth, getMonthName, getTotalBudget, getTotalPlanned }: {
  forecastMonth: string
  setForecastMonth: (month: string) => void
  getMonthName: (month: string) => string
  getTotalBudget: () => number
  getTotalPlanned: () => number
}) {
  return (
    <div className="grid md:grid-cols-3 gap-4 mb-6">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="space-y-2">
            <Label htmlFor="forecastMonth" className="text-blue-700 font-medium">
              Mes a planificar
            </Label>
            <Input
              id="forecastMonth"
              type="month"
              value={forecastMonth}
              onChange={(e) => setForecastMonth(e.target.value)}
              className="border-blue-200 focus:border-blue-400"
            />
            <p className="text-sm text-blue-600 font-medium">{getMonthName(forecastMonth)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4 text-center">
          <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-green-600">Presupuesto Total</p>
          <p className="text-2xl font-bold text-green-700">${getTotalBudget().toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
        <CardContent className="p-4 text-center">
          <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <p className="text-sm text-purple-600">Gastos Planificados</p>
          <p className="text-2xl font-bold text-purple-700">${getTotalPlanned().toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  )
}