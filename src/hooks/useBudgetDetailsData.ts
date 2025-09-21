// Hook para gestión de datos del detalle de presupuesto
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import {
  PresupuestoCategoriaDetalle,
  CategoriaDB,
  MetodoPagoDB,
  PresupuestoInfo,
  ExpenseFormData,
  EditingExpense,
  ExpenseToDelete
} from "@/lib/constants"
import {
  fetchPresupuestoCategorias,
  fetchCategoriasDB,
  fetchMetodosPago,
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

export const useBudgetDetailsData = (presupuestoId: string) => {
  // Estados principales
  const [presupuestoCategorias, setPresupuestoCategorias] = useState<PresupuestoCategoriaDetalle[]>([])
  const [presupuestoInfo, setPresupuestoInfo] = useState<PresupuestoInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [categoriasDB, setCategoriasDB] = useState<CategoriaDB[]>([])
  const [metodosPago, setMetodosPago] = useState<MetodoPagoDB[]>([])

  // Estados de formulario y modales
  const [formData, setFormData] = useState<ExpenseFormData>({
    name: "",
    amount: "",
    paymentDate: "",
    category: "",
    metodoPago: ""
  })
  const [editingExpense, setEditingExpense] = useState<EditingExpense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseToDelete | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      if (!presupuestoId) {
        setPresupuestoCategorias([])
        setPresupuestoInfo(null)
        setLoading(false)
        console.warn("No se proporcionó un ID de presupuesto mensual")
        return
      }
      try {
        const [cats, info] = await Promise.all([
          fetchPresupuestoCategorias(presupuestoId),
          fetchPresupuestoMensual(presupuestoId)
        ])
        setPresupuestoCategorias(cats)
        setPresupuestoInfo(info)
      } catch (e) {
        toast.error("Error al cargar categorías y gastos")
      }
      setLoading(false)
    }
    fetchData()
  }, [presupuestoId])

  // Cargar categorías disponibles
  useEffect(() => {
    async function fetchCategorias() {
      try {
        const cats = await fetchCategoriasDB()
        setCategoriasDB(cats)
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategorias()
  }, [])

  // Cargar métodos de pago
  useEffect(() => {
    async function fetchMetodos() {
      try {
        const metodos = await fetchMetodosPago()
        setMetodosPago(metodos)
      } catch (error) {
        console.error('Error fetching payment methods:', error)
      }
    }
    fetchMetodos()
  }, [])

  // Función para actualizar el total del presupuesto
  const updateBudgetTotal = async (categorias?: PresupuestoCategoriaDetalle[]) => {
    try {
      const categoriasToUse = categorias || presupuestoCategorias
      const totalPresupuestado = calculateBudgetTotal(categoriasToUse)
      const gastosRegistrados = calculateTotalGastosRegistrados(categoriasToUse)
      
      await updatePresupuestoTotal(presupuestoId, totalPresupuestado, gastosRegistrados)
    } catch (error) {
      console.error('Error al actualizar total del presupuesto:', error)
    }
  }

  // Refrescar datos del presupuesto
  const refreshData = async () => {
    try {
      const cats = await fetchPresupuestoCategorias(presupuestoId)
      setPresupuestoCategorias(cats)
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
      const nuevaCategoria = await addCategory(presupuestoId, categoryId)
      setPresupuestoCategorias([...presupuestoCategorias, { ...nuevaCategoria, movimientos: [] }])
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
      await deleteBudgetCategory(cat.id)
      setPresupuestoCategorias(presupuestoCategorias.filter(c => c.categoria_id !== categoriaId))
      toast.success("Categoría eliminada correctamente")
      return true
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar la categoría")
      return false
    }
  }

  const handleCopyFromPreviousMonth = async () => {
    try {
      await copyFromPreviousMonth(presupuestoId)
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
        metodo_pago_id: Number(formData.metodoPago)
      }

      await addBudgetExpense(expenseData)
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
        metodo_pago_id: Number(formData.metodoPago)
      }

      await updateBudgetExpense(expenseData)
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
      await deleteBudgetExpense(expenseToDelete.id)
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
      metodoPago: ""
    })
  }

  const prepareEditExpense = (expense: any, categoryId: number) => {
    setEditingExpense({ expense, categoryId })
    setFormData({
      name: expense.descripcion,
      amount: expense.monto.toString(),
      paymentDate: expense.fecha.split('T')[0],
      category: categoryId.toString(),
      metodoPago: expense.metodo_pago_id?.toString() || ""
    })
  }

  const prepareDeleteExpense = (expense: any) => {
    setExpenseToDelete({ id: expense.id, descripcion: expense.descripcion })
  }

  return {
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