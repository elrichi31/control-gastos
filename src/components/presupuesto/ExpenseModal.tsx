import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
      <DialogContent className="bg-white mx-4 max-w-md backdrop-blur-md">
        <DialogHeader>
          <DialogTitle>{editingExpense ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:outline-none px-3 py-2"
                placeholder="Ej. Compra en supermercado"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Monto</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:outline-none px-3 py-2"
                placeholder="Ej. 150.00"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de pago</label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:outline-none px-3 py-2"
              />
            </div>
            {/* El selector de categoría se elimina, ya que la categoría se define al abrir el modal */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Método de pago</label>
              <select
                value={formData.metodoPago}
                onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:outline-none px-3 py-2"
              >
                <option value="">Selecciona un método de pago</option>
                {metodosPago.map((metodo) => (
                  <option key={metodo.id} value={metodo.id}>
                    {metodo.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600">
              {editingExpense ? "Guardar cambios" : "Agregar gasto"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="bg-white"
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
