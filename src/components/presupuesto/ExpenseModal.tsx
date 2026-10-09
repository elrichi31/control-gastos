import React from "react"
import { ExpenseTagsField } from "@/components/gastos/ExpenseTags"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { MetodoPagoDB, MovimientoPresupuesto } from "@/types/budget"

interface ExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: {
    name: string
    amount: string
    paymentDate: string
    category: string
    metodoPago: string
    tags?: string
  }
  setFormData: React.Dispatch<React.SetStateAction<any>>
  metodosPago: MetodoPagoDB[]
  editingExpense: { expense: MovimientoPresupuesto, categoryId: number } | null
  handleAddExpense: (e: React.FormEvent) => void
  handleUpdateExpense: (e: React.FormEvent) => void
  onCancel: () => void
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  metodosPago,
  editingExpense,
  handleAddExpense,
  handleUpdateExpense,
  onCancel
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingExpense ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="budget-description">Descripción</Label>
              <Input
                id="budget-description"
                controlSize="form"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
                placeholder="Ej. Compra en supermercado"
              />
            </div>
            <div>
              <Label htmlFor="budget-amount">Monto</Label>
              <Input
                id="budget-amount"
                controlSize="form"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="mt-1"
                placeholder="Ej. 150.00"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="budget-date">Fecha de pago</Label>
              <Input
                id="budget-date"
                controlSize="form"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="mt-1"
              />
            </div>
            {/* El selector de categoría se elimina, ya que la categoría se define al abrir el modal */}
            <div>
              <Label htmlFor="budget-payment">Método de pago</Label>
              <Select
                value={formData.metodoPago}
                onValueChange={(value) => setFormData({ ...formData, metodoPago: value })}
              >
                <SelectTrigger id="budget-payment" controlSize="form" className="mt-1">
                  <SelectValue placeholder="Selecciona un método de pago" />
                </SelectTrigger>
                <SelectContent>
                  {metodosPago.map((metodo) => (
                    <SelectItem key={metodo.id} value={String(metodo.id)}>
                      {metodo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ExpenseTagsField value={formData.tags || ""} onChange={tags => setFormData({ ...formData, tags })} />
          <div className="flex gap-2 pt-4">
            <Button size="form" type="submit" className="flex-1">
              {editingExpense ? "Guardar cambios" : "Agregar gasto"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="form"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ExpenseModal
