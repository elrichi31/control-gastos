"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  title = "¿Estás seguro?",
  message = "Esta acción eliminará el gasto permanentemente.",
  confirmLabel = "Eliminar",
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title?: string
  message?: string
  confirmLabel?: string
}) {
  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p>{message}</p>
        <DialogFooter className="mt-4">
          <Button size="form" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button size="form" variant="destructive" onClick={handleConfirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
