"use client"

import React from "react"

import { useState } from "react"
import { Plus, Edit2, Trash2, DollarSign, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb } from "@/components/Breadcrumb"

interface Expense {
  id: string
  name: string
  amount: number
  paymentDate: string
  category: string
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

const allCategories: Category[] = [
  { id: "alimentacion", name: "Alimentación", icon: "🍽️", color: "bg-green-100 text-green-800" },
  { id: "transporte", name: "Transporte", icon: "🚗", color: "bg-blue-100 text-blue-800" },
  { id: "entretenimiento", name: "Entretenimiento", icon: "🎬", color: "bg-purple-100 text-purple-800" },
  { id: "servicios", name: "Servicios", icon: "⚡", color: "bg-yellow-100 text-yellow-800" },
  { id: "suscripciones", name: "Suscripciones", icon: "📱", color: "bg-red-100 text-red-800" },
  { id: "salud", name: "Salud", icon: "🏥", color: "bg-pink-100 text-pink-800" },
  { id: "educacion", name: "Educación", icon: "📚", color: "bg-indigo-100 text-indigo-800" },
  { id: "otros", name: "Otros", icon: "📦", color: "bg-gray-100 text-gray-800" },
]

const initialExpenses: Expense[] = [
  { id: "1", name: "Spotify", amount: 9.99, paymentDate: "2024-06-15", category: "suscripciones" },
  { id: "2", name: "Netflix", amount: 15.99, paymentDate: "2024-06-20", category: "suscripciones" },
  { id: "3", name: "Supermercado", amount: 300, paymentDate: "2024-06-05", category: "alimentacion" },
  { id: "4", name: "Gasolina", amount: 80, paymentDate: "2024-06-10", category: "transporte" },
]

export default function BudgetPage({ params }: { params: Promise<{ mes: string }> }) {
  const { mes } = React.use(params)
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [activeCategories, setActiveCategories] = useState<string[]>(["suscripciones", "alimentacion", "transporte"])
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    paymentDate: "",
    category: "",
  })

  const monthName = mes.charAt(0).toUpperCase() + mes.slice(1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingExpense) {
      setExpenses(
        expenses.map((expense) =>
          expense.id === editingExpense.id
            ? { ...expense, ...formData, amount: Number.parseFloat(formData.amount) }
            : expense,
        ),
      )
    } else {
      const newExpense: Expense = {
        id: Date.now().toString(),
        name: formData.name,
        amount: Number.parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        category: formData.category,
      }
      setExpenses([...expenses, newExpense])
    }

    setFormData({ name: "", amount: "", paymentDate: "", category: "" })
    setEditingExpense(null)
    setIsExpenseDialogOpen(false)
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      paymentDate: expense.paymentDate,
      category: expense.category,
    })
    setIsExpenseDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id))
  }

  const handleAddCategory = (categoryId: string) => {
    setActiveCategories([...activeCategories, categoryId])
    setIsCategoryDialogOpen(false)
  }

  const handleRemoveCategory = (categoryId: string) => {
    // Solo permitir remover si no tiene gastos
    const hasExpenses = expenses.some((expense) => expense.category === categoryId)
    if (!hasExpenses) {
      setActiveCategories(activeCategories.filter((id) => id !== categoryId))
    }
  }

  const getExpensesByCategory = (categoryId: string) => {
    return expenses.filter((expense) => expense.category === categoryId)
  }

  const getCategoryTotal = (categoryId: string) => {
    return getExpensesByCategory(categoryId).reduce((total, expense) => total + expense.amount, 0)
  }

  const getTotalBudget = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0)
  }

  const getAvailableCategories = () => {
    return allCategories.filter((category) => !activeCategories.includes(category.id))
  }

  const getActiveCategories = () => {
    return allCategories.filter((category) => activeCategories.includes(category.id))
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <Breadcrumb items={[{ label: "Presupuesto", href: "/presupuesto" }, { label: monthName }]} large />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end mt-8 gap-4">
          <div className="text-center sm:text-right">
            <p className="text-sm text-gray-600">Total presupuestado</p>
            <p className="text-xl lg:text-2xl font-bold text-green-600">${getTotalBudget().toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Categorías activas */}
        {getActiveCategories().map((category) => {
          const categoryExpenses = getExpensesByCategory(category.id)
          const categoryTotal = getCategoryTotal(category.id)
          const hasExpenses = categoryExpenses.length > 0

          return (
            <Card key={category.id} className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl lg:text-2xl">{category.icon}</span>
                    <div>
                      <CardTitle className="text-base lg:text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-gray-600">{categoryExpenses.length} gastos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={category.color}>${categoryTotal.toFixed(2)}</Badge>
                    {!hasExpenses && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCategory(category.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {categoryExpenses.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No hay gastos en esta categoría</p>
                ) : (
                  categoryExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{expense.name}</p>
                        <p className="text-sm text-gray-600">
                          Pago: {new Date(expense.paymentDate).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 lg:gap-2 ml-2">
                        <span className="font-semibold text-gray-900 text-sm lg:text-base">
                          ${expense.amount.toFixed(2)}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}

                <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full bg-white text-sm lg:text-base"
                      onClick={() => {
                        setFormData({ ...formData, category: category.id })
                        setEditingExpense(null)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar gasto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white mx-4 max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingExpense ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nombre del gasto</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="ej. Spotify, Netflix, Supermercado..."
                          className="bg-white"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="amount">Monto</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="0.00"
                            className="pl-10 bg-white"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="paymentDate">Fecha tentativa de pago</Label>
                        <Input
                          id="paymentDate"
                          type="date"
                          value={formData.paymentDate}
                          onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                          className="bg-white"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="category">Categoría</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            {getActiveCategories().map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600">
                          {editingExpense ? "Actualizar" : "Agregar"} gasto
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-white"
                          onClick={() => {
                            setIsExpenseDialogOpen(false)
                            setEditingExpense(null)
                            setFormData({ name: "", amount: "", paymentDate: "", category: "" })
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )
        })}

        {/* Botón para agregar categoría */}
        {getAvailableCategories().length > 0 && (
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Card className="bg-gray-50 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <Plus className="w-8 h-8 text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-600 mb-1">Agregar categoría</h3>
                  <p className="text-sm text-gray-500">Selecciona una categoría para organizar tus gastos</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="bg-white mx-4 max-w-md">
              <DialogHeader>
                <DialogTitle>Seleccionar categoría</DialogTitle>
              </DialogHeader>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getAvailableCategories().map((category) => (
                  <Button
                    key={category.id}
                    variant="outline"
                    className="w-full justify-start bg-white hover:bg-gray-50"
                    onClick={() => handleAddCategory(category.id)}
                  >
                    <span className="text-xl mr-3">{category.icon}</span>
                    {category.name}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Mensaje cuando no hay categorías disponibles */}
      {getAvailableCategories().length === 0 && activeCategories.length === allCategories.length && (
        <div className="text-center py-8">
          <p className="text-gray-500">Todas las categorías están siendo utilizadas</p>
        </div>
      )}
    </div>
  )
}
