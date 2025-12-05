"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createExpense } from "@/services/expenses"
import { fetchCategories, type Category } from "@/services/categories"
import { fetchPaymentMethods, type PaymentMethod } from "@/services/paymentMethods"

export function ExpenseForm({ fetchExpenses }: { fetchExpenses: () => void }) {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    categoryId: "",
    date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0],
    paymentMethodId: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      categoryId: "",
      date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0],
      paymentMethodId: "",
    })
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

    const handleQuickAmount = (amount: number) => {
    setFormData(prev => ({ ...prev, amount: amount.toString() }))
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (!formData.description.trim()) {
      newErrors.description = "La descripción es obligatoria"
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "El monto debe ser mayor a 0"
    }
    if (!formData.categoryId) {
      newErrors.categoryId = "Selecciona una categoría"
    }
    if (!formData.paymentMethodId) {
      newErrors.paymentMethodId = "Selecciona un método de pago"
    }
    if (!formData.date) {
      newErrors.date = "La fecha es obligatoria"
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
      await createExpense({
        descripcion: formData.description,
        monto: parseFloat(formData.amount),
        categoria_id: parseInt(formData.categoryId),
        fecha: formData.date,
        metodo_pago_id: parseInt(formData.paymentMethodId),
        is_recurrent: false, // Gastos manuales siempre son NO recurrentes
      })

      setSubmitSuccess(true)
      resetForm()
      setErrors({})
      fetchExpenses()
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (error) {
      console.error("Error al agregar gasto:", error)
      alert("Ocurrió un error al agregar el gasto")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
          📝 Descripción <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="¿En qué gastaste? Ej: Almuerzo, Gasolina, Supermercado..."
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

      {/* Monto - Más prominente en móvil */}
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-sm font-semibold text-gray-700">
          💵 Monto (USD) <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-semibold">
            $
          </span>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="25.00"
            value={formData.amount}
            onChange={(e) => {
              setFormData({ ...formData, amount: e.target.value })
              if (errors.amount) setErrors({ ...errors, amount: "" })
            }}
            className={`pl-8 text-lg font-semibold border-2 transition-colors h-14 rounded-lg ${errors.amount ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'}`}
          />
        </div>
        {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
      </div>

      {/* Fecha */}
      <div className="space-y-2">
        <Label htmlFor="date" className="text-sm font-semibold text-gray-700">
          📅 Fecha <span className="text-red-500">*</span>
        </Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => {
            setFormData({ ...formData, date: e.target.value })
            if (errors.date) setErrors({ ...errors, date: "" })
          }}
          className={`text-base border-2 transition-colors h-12 rounded-lg ${errors.date ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
        />
        {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
      </div>

      {/* Categoría */}
      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm font-semibold text-gray-700">
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
        <Label htmlFor="paymentMethod" className="text-sm font-semibold text-gray-700">
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
            <SelectValue placeholder="¿Cómo pagaste?" />
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

      {/* Botón de envío - Más prominente */}
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
          <div className="flex items-center gap-2">
            <span>💾</span>
            Registrar Gasto
          </div>
        )}
      </Button>
    </form>
  )
}
