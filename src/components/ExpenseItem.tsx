import { Trash2, Tag, Calendar, CreditCard } from "lucide-react"
import { Gasto } from "@/hooks/useGastosFiltrados"
import { Badge } from "@/components/ui/badge"

type Props = {
  expense: Gasto
  onDelete: (id: string) => void
}

const categoryColors: { [key: string]: string } = {
  Alimentacion: "bg-green-100 text-green-800",
  Transporte: "bg-blue-100 text-blue-800",
  Entretenimiento: "bg-purple-100 text-purple-800",
  Salud: "bg-red-100 text-red-800",
  Educación: "bg-yellow-100 text-yellow-800",
  Compras: "bg-pink-100 text-pink-800",
  Servicios: "bg-gray-100 text-gray-800",
  Otros: "bg-orange-100 text-orange-800",
}

function toLocalDateFromString(dateStr: string): Date {
  const [year, month, day] = dateStr.slice(0, 10).split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function ExpenseItem({ expense, onDelete }: Props) {

  console.log("Rendering ExpenseItem for:", expense)
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-medium text-sm">{expense.descripcion}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={categoryColors[expense.categoria?.nombre] || "bg-gray-100 text-gray-800"}>
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
          {toLocalDateFromString(expense.fecha).toLocaleDateString("es-ES")}
        </div>
        <div className="flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          {expense.metodo_pago?.nombre || "Sin método"}
        </div>
      </div>
    </div>
  )
}

