import { Tag, Calendar, CreditCard, Trash2, Repeat, Pencil } from "lucide-react"
import { Gasto } from "@/hooks/useGastosFiltrados"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDisplayDate } from "@/lib/utils"
import { getCategoriaColor } from "@/lib/constants"
import { useState } from "react"
import { ConfirmModal } from "./ConfirmModal"
import { ExpenseTags } from "./ExpenseTags"
import { EditExpenseDialog } from "./EditExpenseDialog"
import { DeleteRecurringExpenseModal } from "./DeleteRecurringExpenseModal"
import { getRecurringExpenseId, deleteExpense, deactivateRecurringExpense } from "@/services/expenses"
import { toast } from "sonner"

type Props = {
  expense: Gasto
  onDelete: (id: string) => void
  onUpdated?: () => void | Promise<void>
  showDeleteIcon?: boolean // Opcional, por defecto será false
}

export function ExpenseItem({ expense, onDelete, onUpdated, showDeleteIcon = false }: Props) {
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [showSimpleModal, setShowSimpleModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

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
      {/* Fila horizontal: en pantallas medianas cada dato va en su columna
          (alineada con la cabecera de ExpenseList); en móvil se apila. */}
      <div className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_7rem_minmax(0,1fr)_6rem_4.5rem]">
        <div className="min-w-0">
          <p className="font-medium text-sm text-foreground truncate" title={expense.descripcion}>{expense.descripcion}</p>
          <ExpenseTags tags={expense.tags} className="mt-1" />
        </div>
        {/* En móvil monto y acciones comparten la primera línea; en md cada uno toma su columna. */}
        <div className="flex items-center justify-end gap-1 md:contents">
        <span className="font-semibold text-sm text-foreground tabular-nums text-right md:order-5">
          ${expense.monto.toFixed(2)}
        </span>
        <div className="flex items-center justify-end gap-1 md:order-6 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100 transition-opacity">
            {onUpdated && (
              <Button size="icon-sm" variant="ghost"
                type="button"
                onClick={() => setShowEdit(true)}
                title="Editar"
                aria-label={`Editar ${expense.descripcion}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {showDeleteIcon && (
              <Button size="icon-sm" variant="ghost-destructive"
                type="button"
                onClick={handleDeleteClick}
                title="Eliminar"
                aria-label={`Eliminar ${expense.descripcion}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
        </div>
        </div>
        <div className="col-span-2 flex items-center gap-1.5 flex-wrap md:col-span-1 md:order-2">
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
        <span className="flex items-center gap-1 text-xs text-muted-foreground md:order-3 md:text-[13px]">
          <Calendar className="h-3 w-3 shrink-0 md:hidden" />
          {formatDisplayDate(expense.fecha)}
        </span>
        <span className="flex items-center gap-1 min-w-0 text-xs text-muted-foreground justify-end md:justify-start md:order-4 md:text-[13px]">
          <CreditCard className="h-3 w-3 shrink-0 md:hidden" />
          <span className="truncate">{expense.metodo_pago?.nombre || "Sin método"}</span>
        </span>
      </div>

      {onUpdated && <EditExpenseDialog expense={expense} open={showEdit} onOpenChange={setShowEdit} onSaved={onUpdated} />}

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

