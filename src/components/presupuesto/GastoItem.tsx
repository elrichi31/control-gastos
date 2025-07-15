import React from "react"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2 } from "lucide-react"
import { MovimientoPresupuesto } from "@/types/budget"

interface GastoItemProps {
  expense: MovimientoPresupuesto
  categoryId: number
  onEditExpense: (expense: MovimientoPresupuesto, categoryId: number) => void
  onDeleteExpense: (expense: MovimientoPresupuesto) => void
}

const GastoItem: React.FC<GastoItemProps> = ({ expense, categoryId, onEditExpense, onDeleteExpense }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{expense.descripcion}</p>
        <p className="text-sm text-gray-600">
          Pago: {new Date(expense.fecha).toLocaleDateString("es-ES")}
        </p>
      </div>
      <div className="flex items-center gap-1 lg:gap-2 ml-2">
        <span className="font-semibold text-gray-900 text-sm lg:text-base">
          ${expense.monto.toFixed(2)}
        </span>
        <Button variant="ghost" size="sm" onClick={() => onEditExpense(expense, categoryId)}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDeleteExpense(expense)}>
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </div>
  )
}

export default GastoItem
