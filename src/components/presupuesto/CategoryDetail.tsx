"use client"

import { useState } from "react"
import { MoreVertical, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExpenseTags } from "@/components/gastos/ExpenseTags"
import { categoryIcon, categoryTile, categoryTone, paymentIcon } from "@/lib/expense-icons"
import { formatMoney } from "@/lib/utils"
import type { MovimientoPresupuesto, PresupuestoCategoriaDetalle } from "@/types/budget"

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

/** "24/10/2026" y su distancia a hoy en palabras. */
function describeDate(fecha: string, now = new Date()) {
  const [year, month, day] = fecha.slice(0, 10).split("-").map(Number)
  if (!year) return { label: fecha, relative: "" }
  const diff = Math.round((startOfDay(now).getTime() - new Date(year, month - 1, day).getTime()) / 86400000)
  const relative = diff === 0 ? "Hoy" : diff === 1 ? "Ayer" : diff === -1 ? "Mañana" : diff > 0 ? `Hace ${diff} días` : `En ${-diff} días`
  return { label: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`, relative }
}

// ponytail: el menú ⋮ es un <details>; no se cierra al hacer clic fuera, solo al elegir una opción o volver a pulsarlo.
function RowMenu({ name, onEdit, onDelete }: { name: string; onEdit: () => void; onDelete: () => void }) {
  const run = (action: () => void) => (event: React.MouseEvent<HTMLButtonElement>) => { event.currentTarget.closest("details")?.removeAttribute("open"); action() }
  return (
    <details className="relative">
      <summary aria-label={`Acciones de ${name}`} className="grid size-9 cursor-pointer list-none place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"><MoreVertical aria-hidden="true" className="size-4" /></summary>
      <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-popover p-1 text-sm shadow-md">
        <button type="button" onClick={run(onEdit)} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left hover:bg-muted"><Pencil aria-hidden="true" className="size-3.5" />Editar</button>
        <button type="button" onClick={run(onDelete)} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-destructive hover:bg-muted"><Trash2 aria-hidden="true" className="size-3.5" />Eliminar</button>
      </div>
    </details>
  )
}

/** Partidas de la categoría elegida: buscar, agregar, editar y eliminar. */
export function CategoryDetail({ categoria, presupuestado, gastado, metodosPago, onAddExpenseClick, onEditExpense, onDeleteExpense, onDeleteCategory }: {
  categoria: PresupuestoCategoriaDetalle
  presupuestado: number
  gastado: number
  metodosPago: readonly { id: number; nombre: string }[]
  onAddExpenseClick: () => void
  onEditExpense: (expense: MovimientoPresupuesto, categoryId: number) => void
  onDeleteExpense: (expense: MovimientoPresupuesto) => void
  onDeleteCategory: (categoriaId: number) => void
}) {
  const [query, setQuery] = useState("")
  const name = categoria.categoria.nombre
  const Icon = categoryIcon(name)
  const movimientos = categoria.movimientos ?? []
  const shown = movimientos.filter(item => item.descripcion.toLowerCase().includes(query.trim().toLowerCase()))
  const left = presupuestado - gastado
  const paymentName = (id: number) => metodosPago.find(method => method.id === id)?.nombre ?? "Sin método"

  return (
    <section aria-label={`Gastos de ${name}`} className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className={`grid size-11 shrink-0 place-items-center rounded-xl ${categoryTile(name)}`}><Icon className={`size-5 ${categoryTone(name)}`} /></span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">Gastos de {name}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground">{movimientos.length} {movimientos.length === 1 ? "gasto" : "gastos"}</span>
              <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 tabular-nums text-muted-foreground">{formatMoney(gastado)} de {formatMoney(presupuestado)}</span>
              {presupuestado > 0 && <span className={`rounded-md px-2 py-0.5 tabular-nums ${left < 0 ? "bg-chart-5/10 text-chart-5" : "bg-chart-2/10 text-chart-2"}`}>{left < 0 ? `${formatMoney(-left)} de más` : `${formatMoney(left)} disponible`}</span>}
            </div>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input controlSize="form" aria-label="Buscar gasto" placeholder="Buscar gasto" value={query} onChange={event => setQuery(event.target.value)} className="pl-9" />
          </div>
          <Button size="form" type="button" onClick={onAddExpenseClick}><Plus aria-hidden="true" className="size-4" />Agregar gasto</Button>
        </div>
      </div>

      {movimientos.length === 0 ? (
        <div className="border-t border-border px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">Aún no hay gastos en esta categoría.</p>
          <Button type="button" variant="ghost" size="sm" className="mt-2 text-destructive" onClick={() => onDeleteCategory(categoria.categoria_id)}>Quitar categoría</Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Descripción</TableHead><TableHead>Fecha</TableHead><TableHead>Método de pago</TableHead><TableHead className="text-right">Monto</TableHead><TableHead className="w-14 pr-4"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 && <TableRow className="hover:bg-transparent"><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Ningún gasto coincide con “{query}”.</TableCell></TableRow>}
            {shown.map(item => {
              const date = describeDate(item.fecha)
              const PaymentIcon = paymentIcon(paymentName(item.metodo_pago_id))
              return (
                <TableRow key={item.id}>
                  <TableCell className="py-3 pl-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-lg ${categoryTile(name)}`}><Icon className={`size-4 ${categoryTone(name)}`} /></span>
                      <div className="min-w-0"><p className="truncate text-sm font-medium">{item.descripcion}</p><ExpenseTags tags={item.tags} className="mt-0.5" /></div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-[13px]"><p className="tabular-nums">{date.label}</p><p className="text-xs text-muted-foreground">{date.relative}</p></TableCell>
                  <TableCell className="py-3 text-[13px] text-muted-foreground"><span className="inline-flex items-center gap-2"><PaymentIcon aria-hidden="true" className="size-4" />{paymentName(item.metodo_pago_id)}</span></TableCell>
                  <TableCell className="py-3 text-right"><p className="text-sm font-semibold tabular-nums">{formatMoney(item.monto)}</p>{presupuestado > 0 && <p className="text-xs text-muted-foreground tabular-nums">{Math.round(item.monto / presupuestado * 100)}% del total</p>}</TableCell>
                  <TableCell className="py-3 pr-4 text-right"><RowMenu name={item.descripcion} onEdit={() => onEditExpense(item, categoria.id)} onDelete={() => onDeleteExpense(item)} /></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {movimientos.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
          <span>Mostrando {shown.length} de {movimientos.length} gastos</span>
          {presupuestado > 0 && <span>{left < 0 ? "Te pasaste por " : "Te quedan "}<span className={`font-semibold tabular-nums ${left < 0 ? "text-chart-5" : "text-chart-2"}`}>{formatMoney(Math.abs(left))}</span> en esta categoría</span>}
        </div>
      )}
    </section>
  )
}
