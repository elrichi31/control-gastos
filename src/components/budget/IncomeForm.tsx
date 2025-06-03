"use client"

import { useState } from "react"
import { Plus, TrendingUp, CalendarIcon, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Income } from "../../types/budget"

interface IncomeFormProps {
  onAddIncome: (income: Omit<Income, "id">) => void
}

export function IncomeForm({ onAddIncome }: IncomeFormProps) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState<Date>(new Date())
  const [isRecurring, setIsRecurring] = useState(false)

  const handleSubmit = () => {
    if (description && amount) {
      onAddIncome({
        description,
        amount: Number.parseFloat(amount),
        date,
        isRecurring,
      })
      setDescription("")
      setAmount("")
      setIsRecurring(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Ingresos Esperados
        </CardTitle>
        <CardDescription>Agrega tus fuentes de ingresos para este mes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="income-description">Descripción</Label>
            <Input
              id="income-description"
              placeholder="Ej: Salario, Freelance, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="income-amount">Cantidad</Label>
            <Input
              id="income-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="income-date">Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="income-date" variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: es }) : "Selecciona una fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="income-recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
            />
            <Label htmlFor="income-recurring" className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Ingreso recurrente (mensual)
            </Label>
          </div>
          <Button onClick={handleSubmit} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Ingreso
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
