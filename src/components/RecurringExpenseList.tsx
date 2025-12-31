"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Trash2, Calendar, DollarSign, Clock, Tag, CreditCard, Repeat, Edit } from "lucide-react"
import { GastoRecurrente } from "@/types/recurring-expense"
import { fetchRecurringExpenses, deleteRecurringExpense, updateRecurringExpense } from "@/services/recurring-expenses"
import { fetchCategories, type Category } from "@/services/categories"
import { fetchPaymentMethods, type PaymentMethod } from "@/services/paymentMethods"
import { ConfirmModal } from "@/components/ConfirmModal"
import { EditRecurringExpenseModal } from "@/components/EditRecurringExpenseModal"
import toast from "react-hot-toast"

const DIAS_SEMANA: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
}

export function RecurringExpenseList() {
  const [expenses, setExpenses] = useState<GastoRecurrente[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editExpense, setEditExpense] = useState<GastoRecurrente | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [expensesData, categoriesData, paymentMethodsData] = await Promise.all([
        fetchRecurringExpenses(),
        fetchCategories(),
        fetchPaymentMethods(),
      ])
      setExpenses(expensesData)
      setCategories(categoriesData)
      setPaymentMethods(paymentMethodsData)
    } catch (error) {
      console.error("Error al cargar datos:", error)
      toast.error("Error al cargar los gastos recurrentes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await updateRecurringExpense(id, { activo: !currentActive })
      setExpenses(prev =>
        prev.map(exp => (exp.id === id ? { ...exp, activo: !currentActive } : exp))
      )
      toast.success(`Gasto ${!currentActive ? 'activado' : 'desactivado'} correctamente`)
    } catch (error) {
      console.error("Error al cambiar estado:", error)
      toast.error("Error al cambiar el estado del gasto")
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteRecurringExpense(deleteId)
      setExpenses(prev => prev.filter(exp => exp.id !== deleteId))
      toast.success("Gasto recurrente eliminado correctamente")
      setDeleteId(null)
    } catch (error) {
      console.error("Error al eliminar:", error)
      toast.error("Error al eliminar el gasto recurrente")
    }
  }

  const getCategoryName = (id: number) => {
    return categories.find(c => c.id === id)?.nombre || "Sin categoría"
  }

  const getPaymentMethodName = (id: number) => {
    return paymentMethods.find(p => p.id === id)?.nombre || "Sin método"
  }

  const handleEdit = async (id: number, data: Partial<GastoRecurrente>) => {
    try {
      await updateRecurringExpense(id, data)
      setExpenses(prev =>
        prev.map(exp => (exp.id === id ? { ...exp, ...data } : exp))
      )
      toast.success("Gasto recurrente actualizado correctamente")
    } catch (error) {
      console.error("Error al editar:", error)
      toast.error("Error al actualizar el gasto recurrente")
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 dark:border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <Card className="border-2 border-dashed border-gray-300 dark:border-neutral-700 dark:bg-neutral-900">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Repeat className="w-20 h-20 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No tienes gastos recurrentes
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">
            Crea tu primer gasto recurrente desde "Crear Nuevo" en el menú de Gastos
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {expenses.map((expense) => (
          <Card
            key={expense.id}
            className={`relative overflow-hidden transition-all hover:shadow-lg ${
              expense.activo
                ? "border-2 border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                : "border-2 border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-900 opacity-75"
            }`}
          >
            {/* Badge de estado en la esquina */}
            <div className="absolute top-3 right-3">
              <Badge
                variant={expense.activo ? "default" : "secondary"}
                className={expense.activo ? "bg-blue-600 dark:bg-neutral-700" : "bg-gray-500 dark:bg-gray-600"}
              >
                {expense.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="text-lg pr-20 line-clamp-2 dark:text-white">
                {expense.descripcion}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Monto destacado */}
              <div className="flex items-center justify-center py-3 bg-gray-50 dark:bg-neutral-900 rounded-lg border-2 border-gray-200 dark:border-neutral-700">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-emerald-400 mr-1" />
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {expense.monto.toFixed(2)}
                </span>
              </div>

              {/* Información de frecuencia y fechas */}
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-neutral-900 p-3 rounded-lg">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium capitalize">{expense.frecuencia}</div>
                    {expense.frecuencia === "semanal" && expense.dia_semana && (
                      <div className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
                        Cada {DIAS_SEMANA[expense.dia_semana]}
                      </div>
                    )}
                    {expense.frecuencia === "mensual" && expense.dia_mes && (
                      <div className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
                        Cada día {expense.dia_mes} del mes
                      </div>
                    )}
                  </div>
                </div>

                {expense.fecha_fin && (
                  <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-neutral-900 p-3 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs">Finaliza</div>
                      <div className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
                        {new Date(expense.fecha_fin).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Categoría y Método de Pago en dos columnas */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col gap-1 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                    <Tag className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Categoría</span>
                  </div>
                  <span className="text-gray-900 dark:text-white text-xs font-medium truncate">
                    {getCategoryName(expense.categoria_id)}
                  </span>
                </div>

                <div className="flex flex-col gap-1 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Método</span>
                  </div>
                  <span className="text-gray-900 dark:text-white text-xs font-medium truncate">
                    {getPaymentMethodName(expense.metodo_pago_id)}
                  </span>
                </div>
              </div>

              {/* Controles */}
              <div className="pt-3 border-t border-gray-200 dark:border-neutral-700 space-y-2">
                <div className="flex items-center justify-between bg-gray-50 dark:bg-neutral-900 p-2 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {expense.activo ? "Activado" : "Desactivado"}
                  </span>
                  <Switch
                    checked={expense.activo}
                    onCheckedChange={() => handleToggleActive(expense.id, expense.activo)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditExpense(expense)}
                    className="w-full dark:bg-neutral-800 dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteId(expense.id)}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <EditRecurringExpenseModal
        expense={editExpense}
        open={editExpense !== null}
        onClose={() => setEditExpense(null)}
        onSave={handleEdit}
        categories={categories}
        paymentMethods={paymentMethods}
      />

      <ConfirmModal
        open={deleteId !== null}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </>
  )
}
