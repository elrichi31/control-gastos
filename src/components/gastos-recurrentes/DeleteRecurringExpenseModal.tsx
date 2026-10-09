"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface DeleteRecurringExpenseModalProps {
  open: boolean
  onCancel: () => void
  onDeleteSingle: () => void
  onDeleteAll: () => void
  isDeleting?: boolean
}

export function DeleteRecurringExpenseModal({
  open,
  onCancel,
  onDeleteSingle,
  onDeleteAll,
  isDeleting = false
}: DeleteRecurringExpenseModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <DialogTitle className="text-xl">Eliminar Gasto Recurrente</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-foreground mb-4">
            Este gasto es parte de un gasto recurrente. ¿Qué deseas hacer?
          </p>
          
          <div className="space-y-3">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/25">
              <p className="text-sm font-medium text-foreground mb-1">Eliminar solo este gasto</p>
              <p className="text-xs text-muted-foreground">
                Solo se eliminará este gasto específico. Los demás gastos recurrentes seguirán generándose.
              </p>
            </div>
            
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/25">
              <p className="text-sm font-medium text-destructive mb-1">Eliminar gasto recurrente completo</p>
              <p className="text-xs text-muted-foreground">
                Se eliminará este gasto y se desactivará el gasto recurrente para que no se generen más gastos en el futuro.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <Button
            size="form"
            variant="outline"
            onClick={onDeleteSingle}
            disabled={isDeleting}
            className="w-full"
          >
            Eliminar solo este gasto
          </Button>
          
          <Button
            size="form"
            variant="destructive"
            onClick={onDeleteAll}
            disabled={isDeleting}
            className="w-full"
          >
            {isDeleting ? "Eliminando..." : "Eliminar gasto recurrente completo"}
          </Button>
          
          <Button
            size="form"
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
