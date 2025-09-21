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
import { CreateExpenseInput, validateExpense } from "@entities/expense"

interface ExpenseFormProps {
  onExpenseCreated?: () => void
  onSubmit: (data: CreateExpenseInput) => Promise<void>
  isLoading?: boolean
}

interface FormData {
  description: string
  amount: string
  categoryId: string
  date: string
  paymentMethodId: string
}

interface Category {
  id: number
  nombre: string
}

interface PaymentMethod {
  id: number
  nombre: string
}

export function ExpenseForm({ onExpenseCreated, onSubmit, isLoading = false }: ExpenseFormProps) {
  const [formData, setFormData] = useState<FormData>({
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
        const [catRes, payRes] = await Promise.all([
          fetch("/api/categorias"),
          fetch("/api/metodos_pago"),
        ])

        const [catData, payData] = await Promise.all([catRes.json(), payRes.json()])
        setCategories(catData)
        setPaymentMethods(payData)
      } catch (err) {
        console.error("Error al cargar categorías o métodos de pago", err)
      }
    }

    fetchOptions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Preparar datos para validación
      const expenseData: CreateExpenseInput = {
        descripcion: formData.description,
        monto: parseFloat(formData.amount),
        categoria_id: parseInt(formData.categoryId),
        fecha: formData.date,
        metodo_pago_id: parseInt(formData.paymentMethodId),
      }

      // Validar datos
      const errors = validateExpense(expenseData)
      if (errors.length > 0) {
        console.error("Errores de validación:", errors)
        return
      }

      // Enviar datos
      await onSubmit(expenseData)
      
      setSubmitSuccess(true)
      resetForm()
      onExpenseCreated?.()
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          placeholder="Descripción del gasto"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Monto</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Fecha</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Método de Pago</Label>
        <Select
          value={formData.paymentMethodId}
          onValueChange={(value) => setFormData({ ...formData, paymentMethodId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona método de pago" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700" 
        disabled={isSubmitting || isLoading}
      >
        {isSubmitting || isLoading ? "Guardando..." : "Crear Gasto"}
      </Button>

      {submitSuccess && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          Gasto registrado exitosamente
        </div>
      )}
    </form>
  )
}
