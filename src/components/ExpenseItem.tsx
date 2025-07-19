import { Trash2, Tag, Calendar, CreditCard } from "lucide-react"
import { Gasto } from "@/hooks/useGastosFiltrados"
import { Badge } from "@/components/ui/badge"
import { formatDisplayDate } from "@/lib/dateUtils"
import { COLORES_CATEGORIA } from "@/lib/constants"

type Props = {
  expense: Gasto
  onDelete: (id: string) => void
}

export function ExpenseItem({ expense, onDelete }: Props) {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-medium text-sm">{expense.descripcion}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={COLORES_CATEGORIA[expense.categoria?.nombre as keyof typeof COLORES_CATEGORIA] || "bg-gray-100 text-gray-800"}>
              <Tag className="h-3 w-3 mr-1" />
              {expense.categoria?.nombre}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-red-600">${expense.monto.toFixed(2)}</p>
          <button
            onClick={() => onDelete(expense.id.toString())}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            title="Eliminar"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDisplayDate(expense.fecha)}
        </div>
        <div className="flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          {expense.metodo_pago?.nombre || "Sin método"}
        </div>
      </div>
    </div>
  )
}

