"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GastoRecurrente, Frecuencia } from "@/types/recurring-expense"
import { Category } from "@/services/categories"
import { PaymentMethod } from "@/services/paymentMethods"

interface EditRecurringExpenseModalProps {
  expense: GastoRecurrente | null
  open: boolean
  onClose: () => void
  onSave: (id: number, data: Partial<GastoRecurrente>) => Promise<void>
  categories: Category[]
  paymentMethods: PaymentMethod[]
}

const DIAS_SEMANA = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
]

export function EditRecurringExpenseModal({
  expense,
  open,
  onClose,
  onSave,
  categories,
  paymentMethods,
}: EditRecurringExpenseModalProps) {
  const [formData, setFormData] = useState({
    descripcion: "",
    monto: "",
    categoria_id: "",
    metodo_pago_id: "",
    frecuencia: "mensual" as Frecuencia,
    dia_semana: "",
    dia_mes: "",
    fecha_inicio: "",
    fecha_fin: "",
    usarFechaFin: false,
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (expense) {
      setFormData({
        descripcion: expense.descripcion,
        monto: expense.monto.toString(),
        categoria_id: expense.categoria_id.toString(),
        metodo_pago_id: expense.metodo_pago_id.toString(),
        frecuencia: expense.frecuencia,
        dia_semana: expense.dia_semana?.toString() || "",
        dia_mes: expense.dia_mes?.toString() || "",
        fecha_inicio: expense.fecha_inicio,
        fecha_fin: expense.fecha_fin || "",
        usarFechaFin: !!expense.fecha_fin,
      })
    }
  }, [expense])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expense) return

    setSaving(true)
    try {
      const data: any = {
        descripcion: formData.descripcion,
        monto: parseFloat(formData.monto),
        categoria_id: parseInt(formData.categoria_id),
        metodo_pago_id: parseInt(formData.metodo_pago_id),
        frecuencia: formData.frecuencia,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.usarFechaFin ? formData.fecha_fin : null,
      }

      if (formData.frecuencia === "semanal") {
        data.dia_semana = parseInt(formData.dia_semana)
        data.dia_mes = null
      } else {
        data.dia_mes = parseInt(formData.dia_mes)
        data.dia_semana = null
      }

      await onSave(expense.id, data)
      onClose()
    } catch (error) {
      console.error("Error al guardar:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!expense) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar Gasto Recurrente</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Modifica los detalles del gasto recurrente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-foreground">Descripción</Label>
            <Input
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleChange("descripcion", e.target.value)}
              placeholder="Ej: Netflix, Gym, etc."
              required
              className="bg-muted text-foreground border-border"
            />
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="monto" className="text-foreground">Monto</Label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              min="0"
              value={formData.monto}
              onChange={(e) => handleChange("monto", e.target.value)}
              placeholder="0.00"
              required
              className="bg-muted text-foreground border-border"
            />
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <Label htmlFor="categoria" className="text-foreground">Categoría</Label>
            <Select
              value={formData.categoria_id}
              onValueChange={(value) => handleChange("categoria_id", value)}
            >
              <SelectTrigger className="bg-muted text-foreground border-border">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()} className="text-foreground">
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <Label htmlFor="metodo" className="text-foreground">Método de Pago</Label>
            <Select
              value={formData.metodo_pago_id}
              onValueChange={(value) => handleChange("metodo_pago_id", value)}
            >
              <SelectTrigger className="bg-muted text-foreground border-border">
                <SelectValue placeholder="Selecciona un método" />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id.toString()} className="text-foreground">
                    {method.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frecuencia */}
          <div className="space-y-2">
            <Label htmlFor="frecuencia" className="text-foreground">Frecuencia</Label>
            <Select
              value={formData.frecuencia}
              onValueChange={(value) => handleChange("frecuencia", value as Frecuencia)}
            >
              <SelectTrigger className="bg-muted text-foreground border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="semanal" className="text-foreground">Semanal</SelectItem>
                <SelectItem value="mensual" className="text-foreground">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Día de la semana (solo si es semanal) */}
          {formData.frecuencia === "semanal" && (
            <div className="space-y-2">
              <Label htmlFor="dia_semana" className="text-foreground">Día de la semana</Label>
              <Select
                value={formData.dia_semana}
                onValueChange={(value) => handleChange("dia_semana", value)}
              >
                <SelectTrigger className="bg-muted text-foreground border-border">
                  <SelectValue placeholder="Selecciona un día" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  {DIAS_SEMANA.map((dia) => (
                    <SelectItem key={dia.value} value={dia.value.toString()} className="text-foreground">
                      {dia.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Día del mes (solo si es mensual) */}
          {formData.frecuencia === "mensual" && (
            <div className="space-y-2">
              <Label htmlFor="dia_mes" className="text-foreground">Día del mes (1-28)</Label>
              <Input
                id="dia_mes"
                type="number"
                min="1"
                max="28"
                value={formData.dia_mes}
                onChange={(e) => handleChange("dia_mes", e.target.value)}
                placeholder="1"
                required
                className="bg-muted text-foreground border-border"
              />
            </div>
          )}

          {/* Fecha de inicio */}
          <div className="space-y-2">
            <Label htmlFor="fecha_inicio" className="text-foreground">Fecha de inicio</Label>
            <Input
              id="fecha_inicio"
              type="date"
              value={formData.fecha_inicio}
              onChange={(e) => handleChange("fecha_inicio", e.target.value)}
              required
              className="bg-muted text-foreground border-border"
            />
          </div>

          {/* Fecha de fin (opcional) */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="usar_fecha_fin"
                checked={formData.usarFechaFin}
                onChange={(e) => handleChange("usarFechaFin", e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <Label htmlFor="usar_fecha_fin" className="text-foreground">
                Establecer fecha de fin
              </Label>
            </div>
            {formData.usarFechaFin && (
              <Input
                id="fecha_fin"
                type="date"
                value={formData.fecha_fin}
                onChange={(e) => handleChange("fecha_fin", e.target.value)}
                min={formData.fecha_inicio}
                className="bg-muted text-foreground border-border"
              />
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="bg-muted text-foreground border-border hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
