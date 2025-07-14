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

  const [categories, setCategories] = useState<{ id: number; nombre: string }[]>([])
  const [paymentMethods, setPaymentMethods] = useState<{ id: number; nombre: string }[]>([])

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

    const { description, amount, categoryId, date, paymentMethodId } = formData

    if (!description || !amount || !categoryId || !paymentMethodId) {
      alert("Por favor completa todos los campos")
      return
    }

    const payload = {
      descripcion: description,
      monto: parseFloat(amount),
      fecha: date,
      categoria_id: parseInt(categoryId),
      metodo_pago_id: parseInt(paymentMethodId),
    }

    try {
      setIsSubmitting(true)
      await fetch("/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      fetchExpenses()
    } catch (error) {
      console.error("Error al guardar gasto:", error)
      alert("Error al guardar")
    } finally {
      setIsSubmitting(false)
    }

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          placeholder="Ej: Almuerzo"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona categoría" />
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
            <SelectValue placeholder="Selecciona método" />
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

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Registrar Gasto"}
      </Button>
    </form>
  )
}
