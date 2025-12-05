"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createRecurringExpense } from "@/services/recurring-expenses"
import { fetchCategories, type Category } from "@/services/categories"
import { fetchPaymentMethods, type PaymentMethod } from "@/services/paymentMethods"
import { Frecuencia } from "@/types/recurring-expense"
import toast from "react-hot-toast"

export function RecurringExpenseForm({ onSuccess }: { onSuccess?: () => void }) {
  // Calcular el primer día del mes actual
  const getPrimerDiaMesActual = () => {
    const now = new Date()
    const primerDia = new Date(now.getFullYear(), now.getMonth(), 1)
    return new Date(primerDia.getTime() - primerDia.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0]
  }

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    categoryId: "",
    paymentMethodId: "",
    frecuencia: "" as Frecuencia | "",
    diaSemana: "",
    diaMes: "",
    fechaInicio: getPrimerDiaMesActual(),
    fechaFin: "",
    activo: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [mostrarFechaFin, setMostrarFechaFin] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      categoryId: "",
      paymentMethodId: "",
      frecuencia: "",
      diaSemana: "",
      diaMes: "",
      fechaInicio: getPrimerDiaMesActual(),
      fechaFin: "",
      activo: true,
    })
    setMostrarFechaFin(false)
  }

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [categories, paymentMethods] = await Promise.all([
          fetchCategories(),
          fetchPaymentMethods(),
        ])
        setCategories(categories)
        setPaymentMethods(paymentMethods)
      } catch (err) {
        console.error("Error al cargar categorías o métodos de pago", err)
      }
    }
    fetchOptions()
  }, [])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (!formData.description.trim()) {
      newErrors.description = "La descripción es obligatoria"
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "El monto debe ser mayor a 0"
    }
    if (!formData.frecuencia) {
      newErrors.frecuencia = "Selecciona una frecuencia"
    }
    if (formData.frecuencia === 'semanal' && !formData.diaSemana) {
      newErrors.diaSemana = "Selecciona el día de la semana"
    }
    if (formData.frecuencia === 'mensual' && !formData.diaMes) {
      newErrors.diaMes = "Ingresa el día del mes"
    }
    if (!formData.categoryId) {
      newErrors.categoryId = "Selecciona una categoría"
    }
    if (!formData.paymentMethodId) {
      newErrors.paymentMethodId = "Selecciona un método de pago"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)

    try {
      await createRecurringExpense({
        descripcion: formData.description,
        monto: parseFloat(formData.amount),
        categoria_id: parseInt(formData.categoryId),
        metodo_pago_id: parseInt(formData.paymentMethodId),
        frecuencia: formData.frecuencia as Frecuencia,
        dia_semana: formData.frecuencia === 'semanal' ? parseInt(formData.diaSemana) : undefined,
        dia_mes: formData.frecuencia === 'mensual' ? parseInt(formData.diaMes) : undefined,
        fecha_inicio: formData.fechaInicio,
        fecha_fin: formData.fechaFin || null,
        activo: formData.activo,
      })

      resetForm()
      setErrors({})
      onSuccess?.()
      toast.success("Gasto recurrente creado exitosamente")
    } catch (error) {
      console.error("Error al crear gasto recurrente:", error)
      toast.error(error instanceof Error ? error.message : "Ocurrió un error al crear el gasto recurrente")
    } finally {
      setIsSubmitting(false)
    }
  }

  const diasSemana = [
    { value: "1", label: "Lunes" },
    { value: "2", label: "Martes" },
    { value: "3", label: "Miércoles" },
    { value: "4", label: "Jueves" },
    { value: "5", label: "Viernes" },
    { value: "6", label: "Sábado" },
    { value: "7", label: "Domingo" },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="rec-description" className="text-sm font-semibold text-gray-700">
          📝 Descripción <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="rec-description"
          placeholder="¿Qué gasto se repetirá? Ej: Netflix, Gimnasio, Renta..."
          value={formData.description}
          onChange={(e) => {
            setFormData({ ...formData, description: e.target.value })
            if (errors.description) setErrors({ ...errors, description: "" })
          }}
          className={`min-h-[80px] text-base border-2 transition-colors rounded-lg ${errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
          rows={3}
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
      </div>

      {/* Monto y Frecuencia en una línea */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rec-amount" className="text-sm font-semibold text-gray-700">
            💵 Monto (USD) <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-semibold">
              $
            </span>
            <Input
              id="rec-amount"
              type="number"
              step="0.01"
              placeholder="25.00"
              value={formData.amount}
              onChange={(e) => {
                setFormData({ ...formData, amount: e.target.value })
                if (errors.amount) setErrors({ ...errors, amount: "" })
              }}
              className={`pl-8 text-lg font-semibold border-2 transition-colors h-12 rounded-lg ${errors.amount ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'}`}
            />
          </div>
          {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="frecuencia" className="text-sm font-semibold text-gray-700">
            🔄 Frecuencia <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.frecuencia}
            onValueChange={(value) => {
              setFormData({ ...formData, frecuencia: value as Frecuencia, diaSemana: "", diaMes: "" })
              if (errors.frecuencia) setErrors({ ...errors, frecuencia: "" })
            }}
          >
            <SelectTrigger className={`h-12 text-base border-2 rounded-lg ${errors.frecuencia ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}>
              <SelectValue placeholder="Frecuencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semanal" className="text-base py-3">Semanal</SelectItem>
              <SelectItem value="mensual" className="text-base py-3">Mensual</SelectItem>
            </SelectContent>
          </Select>
          {errors.frecuencia && <p className="text-red-500 text-sm">{errors.frecuencia}</p>}
        </div>
      </div>

      {/* Día de la semana (solo si es semanal) */}
      {formData.frecuencia === 'semanal' && (
        <div className="space-y-2">
          <Label htmlFor="dia-semana" className="text-sm font-semibold text-gray-700">
            📆 Día de la Semana <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.diaSemana}
            onValueChange={(value) => {
              setFormData({ ...formData, diaSemana: value })
              if (errors.diaSemana) setErrors({ ...errors, diaSemana: "" })
            }}
          >
            <SelectTrigger className={`h-12 text-base border-2 rounded-lg ${errors.diaSemana ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}>
              <SelectValue placeholder="Selecciona el día" />
            </SelectTrigger>
            <SelectContent>
              {diasSemana.map((dia) => (
                <SelectItem key={dia.value} value={dia.value} className="text-base py-3">
                  {dia.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.diaSemana && <p className="text-red-500 text-sm">{errors.diaSemana}</p>}
        </div>
      )}

      {/* Día del mes (solo si es mensual) */}
      {formData.frecuencia === 'mensual' && (
        <div className="space-y-2">
          <Label htmlFor="dia-mes" className="text-sm font-semibold text-gray-700">
            📆 Día del Mes <span className="text-red-500">*</span>
          </Label>
          <Input
            id="dia-mes"
            type="number"
            min="1"
            max="28"
            placeholder="Ej: 15"
            value={formData.diaMes}
            onChange={(e) => {
              setFormData({ ...formData, diaMes: e.target.value })
              if (errors.diaMes) setErrors({ ...errors, diaMes: "" })
            }}
            className={`text-base border-2 transition-colors h-12 rounded-lg ${errors.diaMes ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
          />
          <p className="text-xs text-gray-500">Máximo día 28 (compatible con todos los meses)</p>
          {errors.diaMes && <p className="text-red-500 text-sm">{errors.diaMes}</p>}
        </div>
      )}

      {/* Fechas - responsive: columna en móvil, fila en desktop */}
      <div className="space-y-4">
        {/* Fecha de Inicio */}
        <div className="space-y-2">
          <Label htmlFor="fecha-inicio" className="text-sm font-semibold text-gray-700">
            📅 Fecha de Inicio *
          </Label>
          <Input
            id="fecha-inicio"
            type="date"
            value={formData.fechaInicio}
            className="text-base border-2 border-gray-200 bg-gray-50 transition-colors h-12 rounded-lg cursor-not-allowed"
            readOnly
          />
          <p className="text-xs text-gray-500">Inicia desde el 1° del mes actual</p>
        </div>

        {/* Switch para mostrar fecha fin */}
        <div className="flex items-center justify-between space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-1">
            <Label htmlFor="switch-fecha-fin" className="text-sm font-semibold text-gray-700 cursor-pointer">
              ¿Tiene fecha de finalización?
            </Label>
            <p className="text-xs text-gray-500 mt-1">
              Deja desactivado si el gasto es indefinido
            </p>
          </div>
          <Switch
            id="switch-fecha-fin"
            checked={mostrarFechaFin}
            onCheckedChange={(checked) => {
              setMostrarFechaFin(checked)
              if (!checked) {
                setFormData({ ...formData, fechaFin: "" })
              }
            }}
          />
        </div>

        {/* Fecha de Fin - solo se muestra si el switch está activo */}
        {mostrarFechaFin && (
          <div className="space-y-2">
            <Label htmlFor="fecha-fin" className="text-sm font-semibold text-gray-700">
              📅 Fecha de Fin
            </Label>
            <Input
              id="fecha-fin"
              type="date"
              value={formData.fechaFin}
              min={formData.fechaInicio}
              onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
              className="text-base border-2 border-gray-200 focus:border-blue-500 transition-colors h-12 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Categoría */}
      <div className="space-y-2">
        <Label htmlFor="rec-category" className="text-sm font-semibold text-gray-700">
          🏷️ Categoría <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) => {
            setFormData({ ...formData, categoryId: value })
            if (errors.categoryId) setErrors({ ...errors, categoryId: "" })
          }}
        >
          <SelectTrigger className={`h-12 text-base border-2 rounded-lg ${errors.categoryId ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}>
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)} className="text-base py-3">
                {cat.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && <p className="text-red-500 text-sm">{errors.categoryId}</p>}
      </div>

      {/* Método de Pago */}
      <div className="space-y-2">
        <Label htmlFor="rec-paymentMethod" className="text-sm font-semibold text-gray-700">
          💳 Método de Pago <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.paymentMethodId}
          onValueChange={(value) => {
            setFormData({ ...formData, paymentMethodId: value })
            if (errors.paymentMethodId) setErrors({ ...errors, paymentMethodId: "" })
          }}
        >
          <SelectTrigger className={`h-12 text-base border-2 rounded-lg ${errors.paymentMethodId ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}>
            <SelectValue placeholder="¿Cómo pagarás?" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((m) => (
              <SelectItem key={m.id} value={String(m.id)} className="text-base py-3">
                {m.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.paymentMethodId && <p className="text-red-500 text-sm">{errors.paymentMethodId}</p>}
      </div>

      {/* Botón de envío */}
      <Button 
        type="submit" 
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 shadow-lg transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none rounded-xl" 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Guardando...
          </div>
        ) : (
          "💾 Crear Gasto Recurrente"
        )}
      </Button>
    </form>
  )
}
