"use client"

import { AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Income, Expense } from "../../types/budget"

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "income" | "expense"
  item: Income | Expense | null
  onConfirm: (deleteAll: boolean) => void
}

export function DeleteDialog({ open, onOpenChange, type, item, onConfirm }: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Eliminar elemento recurrente
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Este es un {type === "income" ? "ingreso" : "gasto"} recurrente:
              <strong> {item?.description}</strong>
            </p>
            <p>¿Qué deseas hacer?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(false)} className="bg-orange-600 hover:bg-orange-700">
            Eliminar solo este mes
          </AlertDialogAction>
          <AlertDialogAction onClick={() => onConfirm(true)} className="bg-red-600 hover:bg-red-700">
            Eliminar toda la serie recurrente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
