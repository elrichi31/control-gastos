'use client'

import { useRef, useState, type MouseEvent } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface DeleteExpenseButtonProps {
  descripcion: string
  onConfirm: () => Promise<void> | void
}

export function DeleteExpenseButton({ descripcion, onConfirm }: DeleteExpenseButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deletingRef = useRef(false)

  const handleConfirm = async (event: MouseEvent<HTMLButtonElement>) => {
    // Keep the dialog open until the request settles so a second click can't fire a duplicate delete.
    event.preventDefault()
    // useState is a snapshot per render, so two clicks fired before a re-render would both
    // read isDeleting=false; the ref guards synchronously across calls in the same tick.
    if (deletingRef.current) return
    deletingRef.current = true
    setIsDeleting(true)
    try {
      await onConfirm()
      setOpen(false)
    } catch {
      // Error toast is handled by the caller; keep the dialog open so the user can retry.
    } finally {
      deletingRef.current = false
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!isDeleting) setOpen(next) }}>
      <AlertDialogTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost-destructive"
          aria-label={`Eliminar gasto: ${descripcion}`}
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar este gasto?</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a eliminar &quot;{descripcion}&quot;. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? 'Eliminando…' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
