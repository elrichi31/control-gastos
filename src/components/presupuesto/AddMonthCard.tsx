import { Plus, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import React from "react"

interface AddMonthCardProps {
  availableMonths: { name: string; value: string; number: number; disabled?: boolean }[]
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onAdd: (monthValue: string) => void
}

export function AddMonthCard({ availableMonths, isOpen, setIsOpen, onAdd }: AddMonthCardProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="bg-gray-50 dark:bg-neutral-900/50 border-2 border-dashed border-gray-300 dark:border-neutral-600 hover:border-gray-400 dark:hover:border-neutral-500 transition-colors cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Plus className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-3" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-1">Agregar mes</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Selecciona un mes para crear su presupuesto</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-neutral-900 mx-4 max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccionar mes</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {availableMonths.map((month) => (
            <button
              key={month.value}
              className="w-full justify-start bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-md p-3 text-left flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onAdd(month.value)}
              disabled={month.disabled}
            >
              <Calendar className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-900 dark:text-gray-100">{month.name}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
