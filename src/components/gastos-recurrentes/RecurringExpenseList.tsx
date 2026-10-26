"use client"

import { CategoryBadge } from "@/components/gastos/CategoryBadge"
import { formatMoney } from "@/lib/utils"

import { useState, useMemo } from "react"
import { NewExpenseButton } from "@/components/gastos/ExpenseDialogProvider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2, Repeat, Edit, Plus, SkipForward, Sparkles } from "lucide-react"
import { GastoRecurrente, MESES, costoAnual } from "@/types/recurring-expense"
import { fetchRecurringExpenses, deleteRecurringExpense, updateRecurringExpense, createRecurringExpense, fetchRecurringPrices, fetchRecurringPlan, skipRecurringCharge } from "@/services/recurring-expenses"
import { useRemoteQuery, useRemoteMutation } from "@/hooks/useRemoteData"
import { useExpenseCatalogs } from "@/hooks/useExpenseQueries"
import { queryKeys } from "@/lib/query/client"
import { useExpensesStore } from "@/hooks/useExpensesStore"
import { detectSubscriptions, type DetectorExpense, type SubscriptionSuggestion } from "@/lib/subscription-detector"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { EditRecurringExpenseModal } from "@/components/gastos-recurrentes/EditRecurringExpenseModal"
import { fetchRecurringEmailStatus } from '@/services/email-import'
import { RecurringEmailIndicator } from './RecurringEmailIndicator'
import { toast } from "sonner"
import { format, parseISO, addDays } from "date-fns"
import { es } from "date-fns/locale"

const DISMISSED_KEY = "recurrentes.sugerencias.descartadas"

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
  const list = useRemoteQuery([...queryKeys.recurring, 'list'], fetchRecurringExpenses)
  const catalogs = useExpenseCatalogs()
  const expenses = list.data ?? []
  const categories = catalogs.data?.categories ?? []
  const paymentMethods = catalogs.data?.paymentMethods ?? []
  const loading = list.isPending || catalogs.isPending
  const month = format(new Date(), 'yyyy-MM')
  const dates = useRemoteQuery([...queryKeys.recurring, 'schedule', month], () => fetchRecurringPlan(month))
  const nextDates = Object.fromEntries((dates.data?.rules ?? []).map(rule => [rule.id, rule.proxima_fecha ?? null]))
  const priceQuery = useRemoteQuery([...queryKeys.recurring, 'prices'], fetchRecurringPrices)
  const prices = priceQuery.data ?? []
  const emails = useRemoteQuery([...queryKeys.recurring, 'email'], fetchRecurringEmailStatus)
  const emailStatuses = emails.data ?? null
  const emailError = emails.error?.message ?? ''
  const loadEmailStatuses = () => emails.refetch()
  const changed = [queryKeys.recurring, queryKeys.monthPlan, queryKeys.forecast, queryKeys.expenses, queryKeys.budgets]
  const create = useRemoteMutation(createRecurringExpense, changed)
  const remove = useRemoteMutation(deleteRecurringExpense, changed)
  const update = useRemoteMutation(({ id, data }: { id: number; data: Partial<GastoRecurrente> }) => updateRecurringExpense(id, data), changed)
  const skip = useRemoteMutation(skipRecurringCharge, changed)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editExpense, setEditExpense] = useState<GastoRecurrente | null>(null)
  const [skipTarget, setSkipTarget] = useState<GastoRecurrente | null>(null)
  const { gastos: storedExpenses } = useExpensesStore()
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]") } catch { return [] }
  })
  const manualExpenses = useMemo<DetectorExpense[]>(() => storedExpenses.map(e => ({
    descripcion: e.descripcion, monto: Number(e.monto), fecha: e.fecha, categoria_id: e.categoria_id,
    metodo_pago_id: e.metodo_pago_id ?? e.metodo_pago?.id ?? null, is_recurrent: e.is_recurrent,
  })), [storedExpenses])

  const handleSkip = async () => {
    if (!skipTarget) return
    const target = skipTarget
    setSkipTarget(null)
    try {
      const body = await skip.mutateAsync(target.id)
      toast.success(`Se omitió el cobro del ${format(parseISO(body.omitida), "d MMM", { locale: es })} de ${target.descripcion}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo saltar el cobro")
    }
  }

  const dismissSuggestion = (clave: string) => {
    const next = [...dismissed, clave]
    setDismissed(next)
    try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(next)) } catch {}
  }

  const handleConvert = async (s: SubscriptionSuggestion) => {
    const metodo = s.metodo_pago_id ?? paymentMethods[0]?.id
    if (!metodo) return toast.error("Primero crea un método de pago")
    try {
      // Starts tomorrow so the charges already logged by hand are not duplicated.
      await create.mutateAsync({
        descripcion: s.descripcion, monto: s.monto, categoria_id: s.categoria_id, metodo_pago_id: metodo,
        frecuencia: "mensual", dia_mes: s.dia_mes, fecha_inicio: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      })
      toast.success(`${s.descripcion} ahora es recurrente. Ya no hace falta registrarlo a mano.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el gasto recurrente")
    }
  }

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await update.mutateAsync({ id, data: { activo: !currentActive } })
      toast.success(`Gasto ${!currentActive ? 'activado' : 'desactivado'} correctamente`)
    } catch (error) {
      console.error("Error al cambiar estado:", error)
      toast.error("Error al cambiar el estado del gasto")
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await remove.mutateAsync(deleteId)
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

  /** "Mensual · día 13 · próximo 13 nov" / "Semanal · lunes · pausado" */
  const describeFrecuencia = (expense: GastoRecurrente) => {
    let text = expense.frecuencia.charAt(0).toUpperCase() + expense.frecuencia.slice(1)
    if (expense.frecuencia === "semanal" && expense.dia_semana) text += ` · ${DIAS_SEMANA[expense.dia_semana].toLowerCase()}`
    if (expense.frecuencia === "mensual" && expense.dia_mes) text += expense.dia_mes >= 31 ? " · último día" : ` · día ${expense.dia_mes}`
    if (expense.frecuencia === "anual" && expense.dia_mes && expense.mes_anual) text += ` · ${expense.dia_mes} de ${MESES[expense.mes_anual - 1].toLowerCase()}`
    if (!expense.activo) return `${text} · pausado`
    if (!(expense.id in nextDates)) return text
    const next = nextDates[expense.id]
    return next ? `${text} · próximo ${format(parseISO(next), "d MMM", { locale: es })}` : `${text} · finalizado`
  }

  /** "antes $20.00 · nov 2026" for the latest amount change of a rule. */
  const describePrecio = (expense: GastoRecurrente) => {
    const last = prices.find(p => p.gasto_recurrente_id === expense.id)
    if (!last) return null
    const arrow = last.monto_nuevo > last.monto_anterior ? "↑" : "↓"
    return `${arrow} antes ${formatMoney(last.monto_anterior)} · ${format(parseISO(last.cambiado_en), "MMM yyyy", { locale: es })}`
  }

  const canSkip = (expense: GastoRecurrente) => expense.activo && !!nextDates[expense.id]

  const handleEdit = async (id: number, data: Partial<GastoRecurrente>) => {
    try {
      await update.mutateAsync({ id, data })
      toast.success("Gasto recurrente actualizado correctamente")
    } catch (error) {
      console.error("Error al editar:", error)
      toast.error("Error al actualizar el gasto recurrente")
      throw error
    }
  }

  if (list.error || catalogs.error) return <div role="alert" className="space-y-3"><p>No se pudieron cargar los recurrentes.</p><Button onClick={() => { void list.refetch(); void catalogs.refetch() }}>Reintentar</Button></div>

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-muted-foreground/40 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const suggestions = detectSubscriptions(manualExpenses, expenses.map(e => e.descripcion), format(new Date(), "yyyy-MM-dd"))
    .filter(s => !dismissed.includes(s.clave))

  const suggestionsCard = suggestions.length > 0 && (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Posibles suscripciones sin registrar</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Los registras a mano cada mes con el mismo monto. Conviértelos en recurrentes para que se registren solos.
        </p>
        <div className="divide-y divide-border">
          {suggestions.map(s => (
            <div key={s.clave} className="flex items-center justify-between gap-3 py-2 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{s.descripcion}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="tabular-nums">{formatMoney(s.monto)}</span> · día {s.dia_mes} · {s.meses} meses seguidos · {getCategoryName(s.categoria_id)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => dismissSuggestion(s.clave)}>Descartar</Button>
                <Button size="sm" onClick={() => handleConvert(s)}>Convertir en recurrente</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  if (expenses.length === 0) {
    return (
      <>
      {suggestionsCard}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Repeat className="w-8 h-8 text-muted-foreground mb-3" />
          <h3 className="text-base font-semibold text-foreground mb-1">
            No tienes gastos recurrentes
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-5">
            Los gastos recurrentes se registran solos cada semana o cada mes.
          </p>
            <NewExpenseButton kind="recurrente" size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Crear gasto recurrente
            </NewExpenseButton>
        </CardContent>
      </Card>
      </>
    )
  }

  // Weekly x 52, monthly x 12, yearly x 1 (costoAnual); the monthly figure is that / 12.
  const totalAnual = expenses.filter(e => e.activo).reduce((sum, e) => sum + costoAnual(e), 0)
  const totalMensual = totalAnual / 12

  // Soonest charge first; paused and finished rules go last.
  const rank = (e: GastoRecurrente) => (e.activo && nextDates[e.id]) || "9999"
  const sortedExpenses = [...expenses].sort((a, b) => rank(a).localeCompare(rank(b)))

  return (
    <>
      {suggestionsCard}
      <Card className="overflow-hidden lg:fill-y">
        {emailError && <div role="alert" className="flex flex-wrap items-center gap-2 border-b px-4 py-2 text-xs text-muted-foreground"><span className="min-w-0 flex-1">Estado por correo no disponible: {emailError}</span><Button variant="ghost" size="sm" onClick={() => void loadEmailStatuses()}>Reintentar</Button></div>}
        {/* Tabla para desktop */}
        <div className="hidden md:block lg:fill-y">
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
              {sortedExpenses.map((expense) => (
                <TableRow
                  key={expense.id}
                  className={`group ${expense.activo ? "" : "opacity-55"}`}
                >
                  <TableCell className="py-2.5 pl-5 font-medium text-foreground">
                    {expense.descripcion}
                    {describePrecio(expense) && <div className="text-[11px] font-normal text-muted-foreground tabular-nums">{describePrecio(expense)}</div>}
                    {emailStatuses?.[expense.id] && <RecurringEmailIndicator status={emailStatuses[expense.id]} />}
                  </TableCell>
                  <TableCell className="py-2.5 text-muted-foreground whitespace-nowrap">
                    {describeFrecuencia(expense)}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <CategoryBadge name={getCategoryName(expense.categoria_id)} />
                  </TableCell>
                  <TableCell className="py-2.5 text-muted-foreground whitespace-nowrap">
                    {getPaymentMethodName(expense.metodo_pago_id)}
                  </TableCell>
                  <TableCell className="py-2.5 text-right font-medium text-foreground tabular-nums whitespace-nowrap">
                    {formatMoney(expense.monto)}
                    <div className="text-[11px] font-normal text-muted-foreground">{formatMoney(costoAnual(expense))}/año</div>
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
                    <div className="flex items-center justify-end gap-0.5 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100 transition-opacity">
                      {canSkip(expense) && (
                        <Button size="icon-sm" variant="ghost"
                          type="button"
                          onClick={() => setSkipTarget(expense)}
                          title="Saltar el próximo cobro"
                          aria-label={`Saltar el próximo cobro de ${expense.descripcion}`}
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button size="icon-sm" variant="ghost"
                        type="button"
                        onClick={() => setEditExpense(expense)}
                        title="Editar"
                        aria-label={`Editar ${expense.descripcion}`}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon-sm" variant="ghost-destructive"
                        type="button"
                        onClick={() => setDeleteId(expense.id)}
                        title="Eliminar"
                        aria-label={`Eliminar ${expense.descripcion}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* En móvil la tabla no cabe: se apila como filas */}
        <div className="md:hidden divide-y divide-border">
          {sortedExpenses.map((expense) => (
            <div key={expense.id} className={`px-4 py-3 ${expense.activo ? "" : "opacity-55"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{expense.descripcion}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{describeFrecuencia(expense)}</p>
                  {describePrecio(expense) && <p className="text-[11px] text-muted-foreground tabular-nums">{describePrecio(expense)}</p>}
                  {emailStatuses?.[expense.id] && <RecurringEmailIndicator status={emailStatuses[expense.id]} />}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-medium text-foreground tabular-nums">{formatMoney(expense.monto)}</span>
                  <p className="text-[11px] text-muted-foreground tabular-nums">{formatMoney(costoAnual(expense))}/año</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <CategoryBadge name={getCategoryName(expense.categoria_id)} />
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
                  {canSkip(expense) && (
                    <Button size="icon-sm" variant="ghost"
                      type="button"
                      onClick={() => setSkipTarget(expense)}
                      title="Saltar el próximo cobro"
                      aria-label={`Saltar el próximo cobro de ${expense.descripcion}`}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="icon-sm" variant="ghost"
                    type="button"
                    onClick={() => setEditExpense(expense)}
                    title="Editar"
                    aria-label={`Editar ${expense.descripcion}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon-sm" variant="ghost-destructive"
                    type="button"
                    onClick={() => setDeleteId(expense.id)}
                    title="Eliminar"
                    aria-label={`Eliminar ${expense.descripcion}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <p className="text-xs text-muted-foreground mt-3">
        {expenses.length} {expenses.length === 1 ? "gasto recurrente" : "gastos recurrentes"}
        {totalMensual > 0 && (
          <> · <span className="tabular-nums">{formatMoney(totalMensual)}</span> al mes (aprox.) · <span className="tabular-nums">{formatMoney(totalAnual)}</span> al año en los activos</>
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

      <ConfirmModal
        open={skipTarget !== null}
        onCancel={() => setSkipTarget(null)}
        onConfirm={handleSkip}
        title="¿Saltar el próximo cobro?"
        message={skipTarget && nextDates[skipTarget.id]
          ? `No se registrará el cobro de ${skipTarget.descripcion} del ${format(parseISO(nextDates[skipTarget.id]!), "d 'de' MMMM", { locale: es })}. Los siguientes siguen normales. No se puede deshacer.`
          : ""}
        confirmLabel="Saltar cobro"
      />
    </>
  )
}
