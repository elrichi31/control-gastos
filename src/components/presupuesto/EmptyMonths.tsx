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
    <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 px-5 py-10 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4"><Calendar aria-hidden="true" className="h-6 w-6 text-primary" /></span>
      <h3 className="text-base font-semibold text-foreground mb-2">No hay meses configurados</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">Agrega tu primer mes para comenzar a gestionar tu presupuesto</p>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Agregar primer mes
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border mx-4 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Seleccionar mes</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allMonths.map((month) => (
              <button
                key={month.value}
                className="w-full justify-start bg-card hover:bg-muted border border-border rounded-md p-3 text-left flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => onAdd(month.value)}
                disabled={month.disabled}
              >
                <Calendar className="w-5 h-5 mr-3 text-muted-foreground" />
                <span className="text-foreground">{month.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
