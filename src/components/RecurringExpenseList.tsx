"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2, Repeat, Edit, Plus } from "lucide-react"
import { GastoRecurrente } from "@/types/recurring-expense"
import { fetchRecurringExpenses, deleteRecurringExpense, updateRecurringExpense } from "@/services/recurring-expenses"
import { fetchCategories, type Category } from "@/services/categories"
import { fetchPaymentMethods, type PaymentMethod } from "@/services/paymentMethods"
import { ConfirmModal } from "@/components/ConfirmModal"
import { EditRecurringExpenseModal } from "@/components/EditRecurringExpenseModal"
import { getCategoriaColor } from "@/lib/constants"
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

  /** "Mensual · día 13" / "Semanal · lunes" */
  const describeFrecuencia = (expense: GastoRecurrente) => {
    const base = expense.frecuencia.charAt(0).toUpperCase() + expense.frecuencia.slice(1)
    if (expense.frecuencia === "semanal" && expense.dia_semana) {
      return `${base} · ${DIAS_SEMANA[expense.dia_semana].toLowerCase()}`
    }
    if (expense.frecuencia === "mensual" && expense.dia_mes) {
      return `${base} · día ${expense.dia_mes}`
    }
    return base
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
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-muted-foreground/40 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Repeat className="w-8 h-8 text-muted-foreground mb-3" />
          <h3 className="text-base font-semibold text-foreground mb-1">
            No tienes gastos recurrentes
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-5">
            Los gastos recurrentes se registran solos cada semana o cada mes.
          </p>
          <Link href="/form?tipo=recurrente">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Crear gasto recurrente
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const totalMensual = expenses
    .filter(e => e.activo && e.frecuencia === "mensual")
    .reduce((sum, e) => sum + e.monto, 0)

  return (
    <>
      <Card className="overflow-hidden">
        {/* Tabla para desktop */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 pl-5 text-xs font-medium">Descripción</TableHead>
                <TableHead className="h-10 text-xs font-medium">Frecuencia</TableHead>
                <TableHead className="h-10 text-xs font-medium">Categoría</TableHead>
                <TableHead className="h-10 text-xs font-medium">Método</TableHead>
                <TableHead className="h-10 text-right text-xs font-medium">Monto</TableHead>
                <TableHead className="h-10 text-center text-xs font-medium">Activo</TableHead>
                <TableHead className="h-10 w-[80px] pr-5 text-right text-xs font-medium">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow
                  key={expense.id}
                  className={`group ${expense.activo ? "" : "opacity-55"}`}
                >
                  <TableCell className="py-2.5 pl-5 font-medium text-foreground">
                    {expense.descripcion}
                  </TableCell>
                  <TableCell className="py-2.5 text-muted-foreground whitespace-nowrap">
                    {describeFrecuencia(expense)}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge className={`border font-normal ${getCategoriaColor(getCategoryName(expense.categoria_id))}`}>
                      {getCategoryName(expense.categoria_id)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-muted-foreground whitespace-nowrap">
                    {getPaymentMethodName(expense.metodo_pago_id)}
                  </TableCell>
                  <TableCell className="py-2.5 text-right font-medium text-foreground tabular-nums whitespace-nowrap">
                    ${expense.monto.toFixed(2)}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <div className="flex justify-center">
                      <Switch
                        checked={expense.activo}
                        onCheckedChange={() => handleToggleActive(expense.id, expense.activo)}
                        aria-label={`Activar ${expense.descripcion}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 pr-5">
                    {/* Acciones discretas: aparecen al pasar el mouse por la fila */}
                    <div className="flex items-center justify-end gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditExpense(expense)}
                        className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(expense.id)}
                        className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* En móvil la tabla no cabe: se apila como filas */}
        <div className="md:hidden divide-y divide-border">
          {expenses.map((expense) => (
            <div key={expense.id} className={`px-4 py-3 ${expense.activo ? "" : "opacity-55"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{expense.descripcion}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{describeFrecuencia(expense)}</p>
                </div>
                <span className="text-sm font-medium text-foreground tabular-nums shrink-0">
                  ${expense.monto.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <Badge className={`border font-normal ${getCategoriaColor(getCategoryName(expense.categoria_id))}`}>
                  {getCategoryName(expense.categoria_id)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {getPaymentMethodName(expense.metodo_pago_id)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={expense.activo}
                    onCheckedChange={() => handleToggleActive(expense.id, expense.activo)}
                    aria-label={`Activar ${expense.descripcion}`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {expense.activo ? "Activo" : "Pausado"}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setEditExpense(expense)}
                    className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(expense.id)}
                    className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <p className="text-xs text-muted-foreground mt-3">
        {expenses.length} {expenses.length === 1 ? "gasto recurrente" : "gastos recurrentes"}
        {totalMensual > 0 && (
          <> · <span className="tabular-nums">${totalMensual.toFixed(2)}</span> al mes en los activos</>
        )}
      </p>

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
