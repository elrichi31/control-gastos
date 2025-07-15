"use client"

import React, { use, useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Breadcrumb } from "@/components/Breadcrumb"
import { useSearchParams } from "next/navigation"
import { toast } from "react-hot-toast"
import {
  fetchPresupuestoCategorias,
  fetchCategoriasDB,
  fetchMetodosPago,
  addCategory,
  deleteCategory,
  addExpense,
  updateExpense,
  deleteExpense
} from "@/services/budget"
import CategoriaCard from "@/components/presupuesto/CategoriaCard"
import ExpenseModal from "@/components/presupuesto/ExpenseModal"

interface PresupuestoCategoria {
  id: number
  categoria_id: number
  total_categoria: number
  cantidad_gastos: number
  categoria: { nombre: string }
}

interface MovimientoPresupuesto {
  id: number
  descripcion: string
  monto: number
  fecha: string
  metodo_pago_id: number
}

interface PresupuestoCategoriaDetalle {
  id: number
  categoria_id: number
  total_categoria: number
  cantidad_gastos: number
  categoria: { nombre: string }
  movimientos: MovimientoPresupuesto[]
}

interface CategoriaDB {
  id: number;
  nombre: string;
  icono?: string;
  color?: string;
}

interface MetodoPagoDB {
  id: number;
  nombre: string;
}

export default function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 13+ route params ahora son promesas, se debe usar el hook use
  const { id } = use(params)
  const searchParams = useSearchParams()
  const mes = searchParams.get("mes") || ""
  const [presupuestoCategorias, setPresupuestoCategorias] = useState<PresupuestoCategoriaDetalle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategories, setActiveCategories] = useState<string[]>(["suscripciones", "alimentacion", "transporte"])
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    paymentDate: "",
    category: "",
    metodoPago: ""
  })
  const [categoriasDB, setCategoriasDB] = useState<CategoriaDB[]>([])
  const [metodosPago, setMetodosPago] = useState<MetodoPagoDB[]>([])

  // Estado para edición de gasto
  const [editingExpense, setEditingExpense] = useState<null | { expense: MovimientoPresupuesto, categoryId: number }>(null)

  // Estado para el modal de confirmación de eliminación de gasto
  const [expenseToDelete, setExpenseToDelete] = useState<null | { id: number, descripcion: string }>(null)

  const monthName = mes.charAt(0).toUpperCase() + mes.slice(1)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      if (!id) {
        setPresupuestoCategorias([])
        setLoading(false)
        console.warn("No se proporcionó un ID de presupuesto mensual")
        return
      }
      try {
        const cats = await fetchPresupuestoCategorias(id)
        setPresupuestoCategorias(cats)
      } catch (e) {
        toast.error("Error al cargar categorías y gastos")
      }
      setLoading(false)
    }
    fetchData()
  }, [id])

  useEffect(() => {
    async function fetchCategorias() {
      try {
        const cats = await fetchCategoriasDB()
        setCategoriasDB(cats)
      } catch {}
    }
    fetchCategorias()
  }, [id])

  useEffect(() => {
    async function fetchMetodos() {
      try {
        const metodos = await fetchMetodosPago()
        setMetodosPago(metodos)
      } catch {}
    }
    fetchMetodos()
  }, [id])

  // Crear nueva categoría de presupuesto
  const handleAddCategory = async (categoryId: number) => {
    try {
      const nuevaCategoria = await addCategory(id, categoryId)
      setPresupuestoCategorias([...presupuestoCategorias, { ...nuevaCategoria, movimientos: [] }])
      setIsCategoryDialogOpen(false)
      toast.success("Categoría agregada correctamente")
    } catch (e: any) {
      toast.error(e.message || "Error al agregar la categoría")
    }
  }

  // Nueva función para borrar categoría
  const handleDeleteCategory = async (categoriaId: number) => {
    const cat = presupuestoCategorias.find(c => c.categoria_id === categoriaId)
    if (!cat) return
    if (cat.movimientos.length > 0) {
      toast.error("No se puede borrar la categoría porque tiene movimientos asociados.")
      return
    }
    try {
      await deleteCategory(cat.id)
      setPresupuestoCategorias(presupuestoCategorias.filter(c => c.categoria_id !== categoriaId))
      toast.success("Categoría eliminada correctamente")
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar la categoría")
    }
  }

  // Elimina el uso de cat.total_categoria y getTotalBudget basado en backend
  // Calcula el total de cada categoría sumando sus gastos:
  const getCategoryTotal = (cat: PresupuestoCategoriaDetalle) => {
    if (!Array.isArray(cat.movimientos)) return 0
    return cat.movimientos.reduce((sum, mov) => sum + (mov.monto || 0), 0)
  }

  // Calcula el total del presupuesto sumando los totales de cada categoría:
  const getBudgetTotal = () => {
    if (!Array.isArray(presupuestoCategorias)) return 0
    return presupuestoCategorias.reduce((sum, cat) => sum + getCategoryTotal(cat), 0)
  }

  // Usar categoriasDB en vez de allCategories para el modal de agregar categoría
  const getAvailableCategories = () => {
    if (!Array.isArray(presupuestoCategorias)) return []
    return categoriasDB.filter((category) => !presupuestoCategorias.some(c => c.categoria_id === category.id))
  }

  // Crear nuevo movimiento (gasto)
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.amount || !formData.paymentDate || !formData.category) {
      toast.error("Completa todos los campos")
      return
    }
    try {
      await addExpense({
        presupuesto_categoria_id: Number(formData.category),
        descripcion: formData.name,
        monto: Number(formData.amount),
        fecha: formData.paymentDate,
        metodo_pago_id: Number(formData.metodoPago)
      })
      setFormData({ name: "", amount: "", paymentDate: "", category: "", metodoPago: "" })
      setIsExpenseDialogOpen(false)
      toast.success("Gasto agregado correctamente")
      // Refetch de datos
      const cats = await fetchPresupuestoCategorias(id)
      setPresupuestoCategorias(cats)
    } catch (e: any) {
      toast.error(e.message || "Error al agregar el gasto")
    }
  }

  // Función para abrir el modal de edición
  const handleEditExpense = (expense: MovimientoPresupuesto, categoryId: number) => {
    setEditingExpense({ expense, categoryId })
    setFormData({
      name: expense.descripcion,
      amount: expense.monto.toString(),
      paymentDate: expense.fecha.split('T')[0],
      category: categoryId.toString(),
      metodoPago: expense.metodo_pago_id?.toString() || ""
    })
    setIsExpenseDialogOpen(true)
  }

  // Función para actualizar un gasto
  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.amount || !formData.paymentDate || !formData.category) {
      toast.error("Completa todos los campos")
      return
    }
    try {
      await updateExpense({
        id: editingExpense?.expense.id!,
        descripcion: formData.name,
        monto: Number(formData.amount),
        fecha: formData.paymentDate,
        metodo_pago_id: Number(formData.metodoPago)
      })
      setFormData({ name: "", amount: "", paymentDate: "", category: "", metodoPago: "" })
      setIsExpenseDialogOpen(false)
      setEditingExpense(null)
      toast.success("Gasto editado correctamente")
      // Refetch de datos
      const cats = await fetchPresupuestoCategorias(id)
      setPresupuestoCategorias(cats)
    } catch (e: any) {
      toast.error(e.message || "Error al editar el gasto")
    }
  }

  // Función para mostrar el modal de confirmación
  const showDeleteExpenseModal = (expense: MovimientoPresupuesto) => {
    setExpenseToDelete({ id: expense.id, descripcion: expense.descripcion })
  }

  // Función para confirmar la eliminación
  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return
    try {
      await deleteExpense(expenseToDelete.id)
      toast.success("Gasto eliminado correctamente")
      setExpenseToDelete(null)
      // Refetch de datos
      const cats = await fetchPresupuestoCategorias(id)
      setPresupuestoCategorias(cats)
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar el gasto")
      setExpenseToDelete(null)
    }
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <Breadcrumb items={[{ label: "Presupuesto", href: "/presupuesto" }, { label: monthName }]} large />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end mt-8 gap-4">
          <div className="text-center sm:text-right">
            <p className="text-sm text-gray-600">Total presupuestado</p>
            <p className="text-xl lg:text-2xl font-bold text-green-600">${getBudgetTotal().toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Categorías activas */}
        {Array.isArray(presupuestoCategorias) && presupuestoCategorias.length > 0 ? (
          presupuestoCategorias.map((cat) => (
            <CategoriaCard
              key={cat.id}
              categoria={cat}
              onDeleteCategory={handleDeleteCategory}
              onEditExpense={handleEditExpense}
              onDeleteExpense={showDeleteExpenseModal}
              getCategoryTotal={getCategoryTotal}
              onAddExpenseClick={() => {
                setFormData({ ...formData, category: cat.id.toString() })
                setIsExpenseDialogOpen(true)
              }}
            />
          ))
        ) : (
          <div className="text-center py-8 col-span-full">No hay categorías para este presupuesto</div>
        )}

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
                    <span className="text-xl mr-3">{category.icono}</span>
                    {category.nombre}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Mensaje cuando no hay categorías disponibles */}
      {getAvailableCategories().length === 0 && activeCategories.length === categoriasDB.length && (
        <div className="text-center py-8">
          <p className="text-gray-500">Todas las categorías están siendo utilizadas</p>
        </div>
      )}

      {/* En el render, puedes mostrar loading si está cargando */}
      {loading && (
        <div className="text-center py-8">Cargando información...</div>
      )}

      {/* Modal de confirmación de eliminación de gasto */}
      <Dialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <DialogContent className="bg-white mx-4 max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar gasto?</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-gray-700">¿Seguro que quieres eliminar el gasto <span className="font-semibold">{expenseToDelete?.descripcion}</span>? Esta acción no se puede deshacer.</p>
          </div>
          <div className="flex gap-2 pt-4">
            <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={confirmDeleteExpense}>
              Eliminar
            </Button>
            <Button className="flex-1 bg-white" variant="outline" onClick={() => setExpenseToDelete(null)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ExpenseModal
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        formData={formData}
        setFormData={setFormData}
        metodosPago={metodosPago}
        editingExpense={editingExpense}
        handleAddExpense={handleAddExpense}
        handleUpdateExpense={handleUpdateExpense}
        onCancel={() => {
          setIsExpenseDialogOpen(false)
          setFormData({ name: "", amount: "", paymentDate: "", category: "", metodoPago: "" })
          setEditingExpense(null)
        }}
      />
    </div>
  )
}
