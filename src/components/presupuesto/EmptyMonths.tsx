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
      <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">No hay meses configurados</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Agrega tu primer mes para comenzar a gestionar tu presupuesto</p>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="bg-blue-500 hover:bg-blue-600 dark:bg-neutral-700 dark:hover:bg-gray-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Agregar primer mes
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white dark:bg-neutral-950 dark:border-neutral-700 mx-4 max-w-md">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Seleccionar mes</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allMonths.map((month) => (
              <button
                key={month.value}
                className="w-full justify-start bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md p-3 text-left flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => onAdd(month.value)}
                disabled={month.disabled}
              >
                <Calendar className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-900 dark:text-white">{month.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
