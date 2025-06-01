import { Trash2, Tag, Calendar, CreditCard } from "lucide-react"
import { Expense } from "../hooks/useExpenses"
import { Badge } from "@/components/ui/badge"

type Props = {
  expense: Expense
  onDelete: (id: string) => void
}

const categoryColors: { [key: string]: string } = {
  Alimentación: "bg-green-100 text-green-800",
  Transporte: "bg-blue-100 text-blue-800",
  Entretenimiento: "bg-purple-100 text-purple-800",
  Salud: "bg-red-100 text-red-800",
  Educación: "bg-yellow-100 text-yellow-800",
  Compras: "bg-pink-100 text-pink-800",
  Servicios: "bg-gray-100 text-gray-800",
  Otros: "bg-orange-100 text-orange-800",
}

export function ExpenseItem({ expense, onDelete }: Props) {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-medium text-sm">{expense.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={categoryColors[expense.category] || "bg-gray-100 text-gray-800"}>
              <Tag className="h-3 w-3 mr-1" />
              {expense.category}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-red-600">${expense.amount.toFixed(2)}</p>
          <button
            onClick={() => onDelete(expense.id)}
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
          {new Date(expense.date).toLocaleDateString("es-ES")}
        </div>
        <div className="flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          {expense.paymentMethod}
        </div>
      </div>
    </div>
  )
}
