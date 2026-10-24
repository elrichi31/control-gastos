// Hook para gestión de datos del detalle de presupuesto
import { useState } from "react"
import { useExpenseCatalogs } from "@/hooks/useExpenseQueries"
import { useRemoteQuery, useRemoteMutation } from "@/hooks/useRemoteData"
import { queryKeys } from "@/lib/query/client"
import { parseExpenseTags } from "@/lib/expense-tags"
import { toast } from "sonner"
import {
  PresupuestoCategoriaDetalle,
  ExpenseFormData,
  EditingExpense,
  ExpenseToDelete
} from "@/lib/constants"
import {
  fetchPresupuestoCategorias,
  fetchPresupuestoMensual,
  addCategory,
  deleteBudgetCategory,
  copyFromPreviousMonth,
  addBudgetExpense,
  updateBudgetExpense,
  deleteBudgetExpense,
  updatePresupuestoTotal,
  calculateTotalGastosRegistrados,
  calculateBudgetTotal,
  AddBudgetExpenseData,
  UpdateBudgetExpenseData
} from "@/services/budget-details"
import type { MovimientoPresupuesto } from "@/types"

export const useBudgetDetailsData = (presupuestoId: string) => {
  const detailKey = [...queryKeys.budgetDetails, presupuestoId]
  const detail = useRemoteQuery(detailKey, async () => {
    const [categories, info] = await Promise.all([fetchPresupuestoCategorias(presupuestoId), fetchPresupuestoMensual(presupuestoId)])
    return { categories, info }
  }, { enabled: Boolean(presupuestoId) })
  const catalogs = useExpenseCatalogs()
  const presupuestoCategorias = detail.data?.categories ?? []
  const presupuestoInfo = detail.data?.info ?? null
  const categoriasDB = catalogs.data?.categories ?? []
  const metodosPago = catalogs.data?.paymentMethods ?? []
  const loading = detail.isPending || catalogs.isPending
  const changedKeys = [detailKey, queryKeys.budgets, queryKeys.monthPlan]
  const addCategoryMutation = useRemoteMutation((id: number) => addCategory(presupuestoId, id), changedKeys)
  const deleteCategoryMutation = useRemoteMutation(deleteBudgetCategory, changedKeys)
  const copyMutation = useRemoteMutation(() => copyFromPreviousMonth(presupuestoId), changedKeys)
  const addExpenseMutation = useRemoteMutation(addBudgetExpense, changedKeys)
  const updateExpenseMutation = useRemoteMutation(updateBudgetExpense, changedKeys)
  const deleteExpenseMutation = useRemoteMutation(deleteBudgetExpense, changedKeys)

  const totalsMutation = useRemoteMutation(({ total, count }: { total: number; count: number }) => updatePresupuestoTotal(presupuestoId, total, count), [queryKeys.budgets, queryKeys.monthPlan])
  // Estados de formulario y modales
  const [formData, setFormData] = useState<ExpenseFormData>({
    name: "",
    amount: "",
    paymentDate: "",
    category: "",
    metodoPago: "",
    tags: ""
  })
  const [editingExpense, setEditingExpense] = useState<EditingExpense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseToDelete | null>(null)

  // Función para actualizar el total del presupuesto
  const updateBudgetTotal = async (categorias?: PresupuestoCategoriaDetalle[]) => {
    try {
      const categoriasToUse = categorias || presupuestoCategorias
      const totalPresupuestado = calculateBudgetTotal(categoriasToUse)
      const gastosRegistrados = calculateTotalGastosRegistrados(categoriasToUse)
      
      await totalsMutation.mutateAsync({ total: totalPresupuestado, count: gastosRegistrados })
    } catch (error) {
      console.error('Error al actualizar total del presupuesto:', error)
    }
  }

  // Refrescar datos del presupuesto
  const refreshData = async () => {
    try {
      const result = await detail.refetch({ throwOnError: true })
      const cats = result.data!.categories
      await updateBudgetTotal(cats)
      return cats
    } catch (error) {
      console.error('Error refreshing data:', error)
      return presupuestoCategorias
    }
  }

  // Operaciones CRUD para categorías
  const handleAddCategory = async (categoryId: number) => {
    try {
      await addCategoryMutation.mutateAsync(categoryId)
      toast.success("Categoría agregada correctamente")
      return true
    } catch (e: any) {
      toast.error(e.message || "Error al agregar la categoría")
      return false
    }
  }

  const handleDeleteCategory = async (categoriaId: number) => {
    const cat = presupuestoCategorias.find(c => c.categoria_id === categoriaId)
    if (!cat) return false

    if (cat.movimientos.length > 0) {
      toast.error("No se puede borrar la categoría porque tiene movimientos asociados.")
      return false
    }

    try {
      await deleteCategoryMutation.mutateAsync(cat.id)
      toast.success("Categoría eliminada correctamente")
      return true
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar la categoría")
      return false
    }
  }

  const handleCopyFromPreviousMonth = async () => {
    try {
      await copyMutation.mutateAsync(undefined)
      toast.success("Categorías copiadas del mes anterior correctamente")
      await refreshData()
      return true
    } catch (e: any) {
      toast.error(e.message || "Error al copiar del mes anterior")
      return false
    }
  }

  // Operaciones CRUD para gastos
  const handleAddExpense = async (): Promise<boolean> => {
    if (!formData.name || !formData.amount || !formData.paymentDate || !formData.category) {
      toast.error("Completa todos los campos")
      return false
    }

    try {
      const expenseData: AddBudgetExpenseData = {
        presupuesto_categoria_id: Number(formData.category),
        descripcion: formData.name,
        monto: Number(formData.amount),
        fecha: formData.paymentDate,
        metodo_pago_id: Number(formData.metodoPago),
        tags: parseExpenseTags(formData.tags || "")
      }

      await addExpenseMutation.mutateAsync(expenseData)
      await refreshData()
      resetForm()
      toast.success("Gasto agregado correctamente")
      return true
    } catch (e: any) {
      toast.error(e.message || "Error al agregar el gasto")
      return false
    }
  }

  const handleUpdateExpense = async (): Promise<boolean> => {
    if (!formData.name || !formData.amount || !formData.paymentDate || !editingExpense) {
      toast.error("Completa todos los campos")
      return false
    }

    try {
      const expenseData: UpdateBudgetExpenseData = {
        id: editingExpense.expense.id,
        descripcion: formData.name,
        monto: Number(formData.amount),
        fecha: formData.paymentDate,
        metodo_pago_id: Number(formData.metodoPago),
        tags: parseExpenseTags(formData.tags || "")
      }

      await updateExpenseMutation.mutateAsync(expenseData)
      await refreshData()
      resetForm()
      setEditingExpense(null)
      toast.success("Gasto editado correctamente")
      return true
    } catch (e: any) {
      toast.error(e.message || "Error al editar el gasto")
      return false
    }
  }

  const handleDeleteExpense = async (): Promise<boolean> => {
    if (!expenseToDelete) return false

    try {
      await deleteExpenseMutation.mutateAsync(expenseToDelete.id)
      await refreshData()
      setExpenseToDelete(null)
      toast.success("Gasto eliminado correctamente")
      return true
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar el gasto")
      setExpenseToDelete(null)
      return false
    }
  }

  // Funciones auxiliares
  const resetForm = () => {
    setFormData({
      name: "",
      amount: "",
      paymentDate: "",
      category: "",
      metodoPago: "",
      tags: ""
    })
  }

  const prepareEditExpense = (expense: MovimientoPresupuesto, categoryId: number) => {
    setEditingExpense({ expense, categoryId })
    setFormData({
      name: expense.descripcion,
      amount: expense.monto.toString(),
      paymentDate: expense.fecha.split('T')[0],
      category: categoryId.toString(),
      metodoPago: expense.metodo_pago_id?.toString() || "",
      tags: (expense.tags || []).join(", ")
    })
  }

  const prepareDeleteExpense = (expense: MovimientoPresupuesto) => {
    setExpenseToDelete({ id: expense.id, descripcion: expense.descripcion })
  }

  return {
    retry: () => Promise.all([detail.refetch(), catalogs.refetch()]),
    error: detail.error?.message ?? catalogs.error?.message ?? null,
    // Estados
    presupuestoCategorias,
    presupuestoInfo,
    loading,
    categoriasDB,
    metodosPago,
    formData,
    setFormData,
    editingExpense,
    setEditingExpense,
    expenseToDelete,
    setExpenseToDelete,

    // Funciones
    handleAddCategory,
    handleDeleteCategory,
    handleCopyFromPreviousMonth,
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    resetForm,
    prepareEditExpense,
    prepareDeleteExpense,
    refreshData
  }
}
