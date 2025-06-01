"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { v4 as uuidv4 } from "uuid"
import type { Expense } from "./../hooks/useExpenses"

const categories = [
  "Alimentación", "Transporte", "Entretenimiento", "Salud", "Educación", "Compras", "Servicios", "Otros",
]

const paymentMethods = ["Efectivo", "Tarjeta de débito", "Tarjeta de crédito", "Transferencia", "Otro"]

export function ExpenseForm({ fetchExpenses }: { fetchExpenses: () => void }) {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0],
    paymentMethod: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.description || !formData.amount || !formData.category || !formData.paymentMethod) {
      alert("Por favor completa todos los campos")
      return
    }

    const newExpense: Expense = {
      id: uuidv4(),
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
      paymentMethod: formData.paymentMethod,
    }

    try {
      setIsSubmitting(true)
      await fetch("/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpense),
      })
      fetchExpenses()
    } catch (error) {
      console.error("Error al enviar al Google Sheet:", error)
      alert("Error al guardar")
    } finally {
      setIsSubmitting(false)
    }

    setFormData({
      description: "",
      amount: "",
      category: "",
      date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0],
      paymentMethod: "",
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" placeholder="Ej: Almuerzo" value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input id="amount" type="number" step="0.01" value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" type="date" value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
          <SelectContent>{categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Método de Pago</Label>
        <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
          <SelectTrigger><SelectValue placeholder="Selecciona método" /></SelectTrigger>
          <SelectContent>{paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Registrar Gasto"}
      </Button>
    </form>
  )
}
export default ExpenseForm
