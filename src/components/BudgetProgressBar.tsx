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
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow dark:shadow-neutral-800 p-6 w-full max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600 dark:text-gray-400">Presupuesto total:</span>
        <span className="font-medium text-gray-900 dark:text-white">${presupuestoTotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600 dark:text-gray-400">Consumido:</span>
        <span className="font-medium text-blue-700 dark:text-blue-400">${presupuestoConsumido.toFixed(2)} ({porcentaje}%)</span>
      </div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">Restante:</span>
        <span className={restante === 0 ? "font-bold text-red-600 dark:text-red-400" : "font-medium text-green-700 dark:text-green-400"}>${restante.toFixed(2)}</span>
      </div>
      <Progress value={porcentaje} className="h-3 bg-gray-200 dark:bg-neutral-700" />
    </div>
  )
}

export default BudgetProgressBar
