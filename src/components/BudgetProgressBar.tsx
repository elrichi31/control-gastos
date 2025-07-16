import React from "react"
import { Progress } from "@/components/ui/progress"

interface BudgetProgressBarProps {
  categoria: string
  presupuestoTotal: number
  presupuestoConsumido: number
  mes: number // 1-12
  anio: number
}

function getLastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  categoria,
  presupuestoTotal,
  presupuestoConsumido,
  mes,
  anio
}) => {
  const porcentaje = Math.min(100, Math.round((presupuestoConsumido / presupuestoTotal) * 100))
  const restante = Math.max(0, presupuestoTotal - presupuestoConsumido)
  const lastDay = getLastDayOfMonth(anio, mes)
  const fechaInicio = `01/${mes.toString().padStart(2, "0")}/${anio}`
  const fechaFin = `${lastDay}/${mes.toString().padStart(2, "0")}/${anio}`

  return (
    <div className="bg-white rounded-lg shadow p-6 w-full max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600">Presupuesto total:</span>
        <span className="font-medium text-gray-900">${presupuestoTotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600">Consumido:</span>
        <span className="font-medium text-blue-700">${presupuestoConsumido.toFixed(2)} ({porcentaje}%)</span>
      </div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-600">Restante:</span>
        <span className={restante === 0 ? "font-bold text-red-600" : "font-medium text-green-700"}>${restante.toFixed(2)}</span>
      </div>
      <Progress value={porcentaje} className="h-3 bg-gray-200" />
    </div>
  )
}

export default BudgetProgressBar
