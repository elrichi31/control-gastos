import { Calendar, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import React from "react"

interface EmptyMonthsProps {
  allMonths: { name: string; value: string; number: number; disabled?: boolean }[]
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onAdd: (monthValue: string) => void
}

export function EmptyMonths({ allMonths, isOpen, setIsOpen, onAdd }: EmptyMonthsProps) {
  return (
    <div className="text-center py-12">
      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-600 mb-2">No hay meses configurados</h3>
      <p className="text-gray-500 mb-6">Agrega tu primer mes para comenzar a gestionar tu presupuesto</p>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Agregar primer mes
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white mx-4 max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar mes</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allMonths.map((month) => (
              <Button
                key={month.value}
                variant="outline"
                className="w-full justify-start bg-white hover:bg-gray-50"
                onClick={() => onAdd(month.value)}
                disabled={month.disabled}
              >
                <Calendar className="w-5 h-5 mr-3 text-gray-600" />
                {month.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
