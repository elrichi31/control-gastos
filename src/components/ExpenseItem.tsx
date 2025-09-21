import { Tag, Calendar, CreditCard, Trash2 } from "lucide-react"
import { Gasto } from "@/hooks/useGastosFiltrados"
import { Badge } from "@/components/ui/badge"
import { formatDisplayDate } from "@/lib/dateUtils"
import { COLORES_CATEGORIA } from "@/lib/constants"

type Props = {
  expense: Gasto
  onDelete: (id: string) => void
  showDeleteIcon?: boolean // Opcional, por defecto será false
}

export function ExpenseItem({ expense, onDelete, showDeleteIcon = false }: Props) {
  const handleDelete = () => {
    onDelete(expense.id.toString())
  }

  return (
    <>
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
          <div className="text-right flex flex-col items-end gap-1">
            <p className="font-bold text-red-600">${expense.monto.toFixed(2)}</p>
            {showDeleteIcon && (
              <button
                onClick={handleDelete}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
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
    </>
  )
}

