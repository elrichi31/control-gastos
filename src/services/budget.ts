// src/services/budget.ts
import { PresupuestoCategoriaDetalle, CategoriaDB, MetodoPagoDB, MovimientoPresupuesto } from "@/types/budget"

export async function fetchPresupuestoCategorias(id: string): Promise<PresupuestoCategoriaDetalle[]> {
  const res = await fetch(`/api/presupuesto-mensual-detalle?presupuesto_mensual_id=${id}`)
  return await res.json()
}

export async function fetchCategoriasDB(): Promise<CategoriaDB[]> {
  const res = await fetch("/api/categorias")
  return res.ok ? await res.json() : []
}

export async function fetchMetodosPago(): Promise<MetodoPagoDB[]> {
  const res = await fetch("/api/metodos_pago")
  return res.ok ? await res.json() : []
}

export async function addCategory(id: string, categoryId: number) {
  const res = await fetch("/api/presupuesto-categoria", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ presupuesto_mensual_id: id, categoria_id: categoryId })
  })
  if (!res.ok) throw new Error((await res.json()).error || "Error al agregar la categoría")
  return await res.json()
}

export async function deleteCategory(catId: number) {
  const res = await fetch(`/api/presupuesto-categoria?id=${catId}`, { method: "DELETE" })
  if (!res.ok) throw new Error((await res.json()).error || "Error al eliminar la categoría")
  return true
}

export async function addExpense(data: {
  presupuesto_categoria_id: number,
  descripcion: string,
  monto: number,
  fecha: string,
  metodo_pago_id: number
}) {
  const res = await fetch("/api/movimientos-categoria", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error((await res.json()).error || "Error al agregar el gasto")
  return await res.json()
}

export async function updateExpense(data: {
  id: number,
  descripcion: string,
  monto: number,
  fecha: string,
  metodo_pago_id: number
}) {
  const res = await fetch("/api/movimientos-categoria", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error((await res.json()).error || "Error al editar el gasto")
  return await res.json()
}

export async function deleteExpense(id: number) {
  const res = await fetch("/api/movimientos-categoria", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  })
  if (!res.ok) throw new Error((await res.json()).error || "Error al eliminar el gasto")
  return true
}
