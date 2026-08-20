import { Tag, Calendar, CreditCard, Trash2, Repeat } from "lucide-react"
import { Gasto } from "@/hooks/useGastosFiltrados"
import { Badge } from "@/components/ui/badge"
import { formatDisplayDate } from "@/lib/utils"
import { getCategoriaColor } from "@/lib/constants"
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
      {/* Fila tipo database de Notion: sin caja, separada por una linea y con
          hover sutil. El boton de borrar solo aparece al pasar el mouse. */}
      <div className="group px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm text-foreground truncate">{expense.descripcion}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Badge className={`border font-normal ${getCategoriaColor(expense.categoria?.nombre)}`}>
                <Tag className="h-3 w-3 mr-1" />
                {expense.categoria?.nombre}
              </Badge>
              {expense.is_recurrent && (
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  <Repeat className="h-3 w-3 mr-1" />
                  Recurrente
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="font-medium text-sm text-foreground tabular-nums">
              ${expense.monto.toFixed(2)}
            </span>
            {showDeleteIcon && (
              <button
                onClick={handleDeleteClick}
                className="h-6 w-6 grid place-items-center rounded text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 hover:text-destructive hover:bg-muted transition-all"
                title="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDisplayDate(expense.fecha)}
          </span>
          <span className="flex items-center gap-1 truncate">
            <CreditCard className="h-3 w-3 shrink-0" />
            {expense.metodo_pago?.nombre || "Sin método"}
          </span>
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

