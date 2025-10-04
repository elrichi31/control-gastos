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
          <p className="text-gray-700 mb-4">
            Este gasto es parte de un gasto recurrente. ¿Qué deseas hacer?
          </p>
          
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-1">Eliminar solo este gasto</p>
              <p className="text-xs text-blue-700">
                Solo se eliminará este gasto específico. Los demás gastos recurrentes seguirán generándose.
              </p>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-900 mb-1">Eliminar gasto recurrente completo</p>
              <p className="text-xs text-red-700">
                Se eliminará este gasto y se desactivará el gasto recurrente para que no se generen más gastos en el futuro.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onDeleteSingle}
            disabled={isDeleting}
            className="w-full h-11 border-2 border-blue-500 text-blue-700 hover:bg-blue-50 hover:border-blue-600 font-medium"
          >
            Eliminar solo este gasto
          </Button>
          
          <Button
            variant="destructive"
            onClick={onDeleteAll}
            disabled={isDeleting}
            className="w-full h-11 bg-red-600 hover:bg-red-700 font-medium"
          >
            {isDeleting ? "Eliminando..." : "Eliminar gasto recurrente completo"}
          </Button>
          
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            className="w-full h-11 border-2 border-gray-300 hover:bg-gray-50 font-medium"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
