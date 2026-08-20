import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
        {/* Misma altura que una MonthCard para que la cuadrícula no se descuadre */}
        <button className="flex flex-col items-center justify-center gap-2 min-h-[124px] w-full rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center transition-colors hover:bg-muted/60 hover:border-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Plus className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Agregar mes</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Seleccionar mes</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto -mx-1 px-1">
          {availableMonths.map((month) => (
            <button
              key={month.value}
              className="rounded-md border border-border px-3 py-2.5 text-sm text-foreground text-left transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => onAdd(month.value)}
              disabled={month.disabled}
            >
              {month.name}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
