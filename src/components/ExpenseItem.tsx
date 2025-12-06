import { Tag, Calendar, CreditCard, Trash2, Repeat } from "lucide-react"
import { Gasto } from "@/hooks/useGastosFiltrados"
import { Badge } from "@/components/ui/badge"
import { formatDisplayDate } from "@/lib/utils"
import { COLORES_CATEGORIA } from "@/lib/constants"
import { useState } from "react"
import { ConfirmModal } from "./ConfirmModal"
import { DeleteRecurringExpenseModal } from "./DeleteRecurringExpenseModal"
import { getRecurringExpenseId, deleteExpense, deactivateRecurringExpense } from "@/services/expenses"
import toast from "react-hot-toast"

type Props = {
  expense: Gasto
  onDelete: (id: string) => void
  showDeleteIcon?: boolean // Opcional, por defecto será false
}

export function ExpenseItem({ expense, onDelete, showDeleteIcon = false }: Props) {
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [showSimpleModal, setShowSimpleModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)

  const handleDeleteClick = () => {
    if (expense.is_recurrent) {
      setShowRecurringModal(true)
    } else {
      setShowSimpleModal(true)
    }
  }

  const handleDeleteSingle = async () => {
    if (isDeleted) return
    
    try {
      setIsDeleting(true)
      setIsDeleted(true)
      await deleteExpense(expense.id.toString())
      setShowRecurringModal(false)
      setShowSimpleModal(false)
      onDelete(expense.id.toString())
      toast.success("Gasto eliminado correctamente")
    } catch (error) {
      console.error("Error al eliminar gasto:", error)
      toast.error("Error al eliminar el gasto")
      setIsDeleted(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteAll = async () => {
    if (isDeleted) return
    
    try {
      setIsDeleting(true)
      setIsDeleted(true)
      
      // Obtener el ID del gasto recurrente
      const recurringExpenseId = await getRecurringExpenseId(expense.id)
      
      if (!recurringExpenseId) {
        toast.error("No se pudo encontrar el gasto recurrente")
        return
      }

      // Desactivar el gasto recurrente
      await deactivateRecurringExpense(recurringExpenseId)
      
      // Eliminar el gasto actual
      await deleteExpense(expense.id.toString())
      
      setShowRecurringModal(false)
      onDelete(expense.id.toString())
      toast.success("Gasto recurrente desactivado y gasto eliminado")
    } catch (error) {
      console.error("Error al eliminar gasto recurrente:", error)
      toast.error("Error al eliminar el gasto recurrente")
      setIsDeleted(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className={`border dark:border-neutral-700 rounded-lg p-3 space-y-2 ${
        expense.is_recurrent 
          ? 'border-2 border-blue-400 dark:border-neutral-600 bg-blue-50 dark:bg-neutral-900' 
          : ''
      }`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="font-medium text-sm dark:text-white">{expense.descripcion}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className={COLORES_CATEGORIA[expense.categoria?.nombre as keyof typeof COLORES_CATEGORIA] || "bg-gray-100 text-gray-800 dark:bg-neutral-900 dark:text-gray-200"}>
                <Tag className="h-3 w-3 mr-1" />
                {expense.categoria?.nombre}
              </Badge>
              {expense.is_recurrent && (
                <Badge className="bg-blue-600 text-white border-blue-700 dark:bg-neutral-700 dark:border-neutral-600">
                  <Repeat className="h-3 w-3 mr-1 font-bold" />
                  Recurrente
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <p className="font-bold text-red-600 dark:text-red-400">${expense.monto.toFixed(2)}</p>
            {showDeleteIcon && (
              <button
                onClick={handleDeleteClick}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
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

      {/* Modal para gastos recurrentes */}
      <DeleteRecurringExpenseModal
        open={showRecurringModal}
        onCancel={() => setShowRecurringModal(false)}
        onDeleteSingle={handleDeleteSingle}
        onDeleteAll={handleDeleteAll}
        isDeleting={isDeleting}
      />

      {/* Modal simple para gastos normales */}
      <ConfirmModal
        open={showSimpleModal}
        onCancel={() => setShowSimpleModal(false)}
        onConfirm={handleDeleteSingle}
      />
    </>
  )
}

