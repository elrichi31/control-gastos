"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { ArrowRight, CalendarDays, ChevronDown, DollarSign, LayoutGrid, LoaderCircle, Pencil, ReceiptText, CreditCard, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ExpenseTagsField } from '@/components/gastos/ExpenseTags'
import { ForeignTaxField } from '@/components/gastos/ForeignTaxField'
import { computeForeignTax, emptyForeignTax, storedForeignTax, validateForeignTax, withForeignTag } from '@/lib/foreign-tax'
import { formatMoney } from '@/lib/utils'
import { parseExpenseTags } from '@/lib/expense-tags'
import { categoryIcon, categoryTone, paymentIcon } from '@/lib/expense-icons'
import type { ExpenseDraft } from '@/components/gastos/ExpenseDraftSummary'
import { createExpense } from "@/services/expenses"
import { fetchBudgetsByYear } from "@/services/budget-general"
import { fetchPresupuestoCategorias } from "@/services/budget"
import { budgetCrossing, categoryUsage } from "@/lib/month-planning"
import { useExpenseCatalogs } from "@/hooks/useExpenseQueries"
import { useRemoteMutation, useCachedRead, type CachedRead } from "@/hooks/useRemoteData"
import { queryKeys } from "@/lib/query/client"
import { predictExpenseSelection, resolveExpenseSelection, type SuggestionHistory } from "@/lib/expense-suggestions"

const daysAgo = (days: number) => new Date(Date.now() - new Date().getTimezoneOffset() * 60000 - days * 86400000).toISOString().split("T")[0]
const today = () => daysAgo(0)
const shortDate = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("es", { day: "numeric", month: "short" }).replace(/\./g, "") }
const QUICK_AMOUNTS = [5, 10, 20, 50]
const pill = (active: boolean) => `inline-flex shrink-0 whitespace-nowrap min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition-[color,background-color,border-color,scale] duration-150 ease-out active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-ring ${active ? 'border-foreground bg-card font-medium text-foreground' : 'border-input bg-card text-muted-foreground hover:bg-accent hover:text-foreground'}`

/** Avisa si el gasto recién guardado cruza el 80% o el 100% del presupuesto de su categoría. Es solo una ayuda: nunca falla visiblemente. */
async function warnBudgetCrossing(read: CachedRead, saved: { categoryId: number; date: string; total: number }, expenses: readonly { categoria_id: number; monto: number; fecha: string }[]) {
  try {
    const year = Number(saved.date.slice(0, 4)), month = Number(saved.date.slice(5, 7))
    const budget = (await read([...queryKeys.budgets, String(year), 'thresholds'], () => fetchBudgetsByYear(String(year), false))).find(b => b.anio === year && b.mes === month)
    if (!budget) return
    const category = categoryUsage(await read([...queryKeys.budgetDetails, String(budget.id), 'thresholds'], () => fetchPresupuestoCategorias(String(budget.id))), expenses, saved.date.slice(0, 7)).find(c => c.categoria_id === saved.categoryId)
    if (!category) return
    // ponytail: `expenses` es la lista previa al guardado; dos guardados antes de que refresque pueden saltarse un aviso.
    const after = category.gastado + saved.total
    const crossing = budgetCrossing(category.gastado, after, category.presupuestado)
    if (crossing === 'near') toast.warning(`Llevas el ${Math.round(after / category.presupuestado * 100)}% del presupuesto de ${category.nombre} (${formatMoney(after)} de ${formatMoney(category.presupuestado)}).`)
    else if (crossing === 'exceeded') toast.warning(`Te pasaste del presupuesto de ${category.nombre} por ${formatMoney(after - category.presupuestado)}.`)
  } catch { /* el aviso es opcional */ }
}

export function ExpenseForm({ history = [], expenses = [], onDraftChange, onSuccess, onSubmittingChange }: { fetchExpenses: () => void | Promise<void>; history?: readonly SuggestionHistory[]; expenses?: readonly { categoria_id: number; monto: number; fecha: string }[]; onDraftChange?: (draft: ExpenseDraft) => void; onSuccess?: () => void; onSubmittingChange?: (busy: boolean) => void }) {
  const [formData, setFormData] = useState({ description: "", amount: "", categoryId: "", date: today(), paymentMethodId: "", tags: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitting = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const read = useCachedRead()
  const catalogs = useExpenseCatalogs()
  const categories = catalogs.data?.categories ?? []
  const paymentMethods = catalogs.data?.paymentMethods ?? []
  const optionsLoading = catalogs.isPending
  const optionsError = catalogs.error?.message ?? null
  const loadOptions = () => catalogs.refetch()
  const create = useRemoteMutation(createExpense, [queryKeys.expenses, queryKeys.monthPlan, queryKeys.budgets, queryKeys.forecast])
  const [foreignTax, setForeignTax] = useState(emptyForeignTax)
  const [pickDate, setPickDate] = useState(false)
  useEffect(() => { if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) amountRef.current?.focus({ preventScroll: true }) }, [])

  const suggestion = useMemo(() => predictExpenseSelection(formData.description, history, categories, paymentMethods), [formData.description, history, categories, paymentMethods])
  const selection = resolveExpenseSelection(formData, suggestion)
  const suggestedCategory = !formData.categoryId && Boolean(suggestion.categoryId)
  const suggestedPayment = !formData.paymentMethodId && Boolean(suggestion.paymentMethodId)

  useEffect(() => {
    setErrors(previous => {
      if (!(selection.categoryId && previous.categoryId) && !(selection.paymentMethodId && previous.paymentMethodId)) return previous
      return { ...previous, categoryId: selection.categoryId ? "" : previous.categoryId, paymentMethodId: selection.paymentMethodId ? "" : previous.paymentMethodId }
    })
  }, [selection.categoryId, selection.paymentMethodId])

  const change = (key: keyof typeof formData, value: string) => {
    setFormData(previous => ({ ...previous, [key]: value }))
    setErrors(previous => previous[key] ? { ...previous, [key]: "" } : previous)
  }
  const fieldError = (key: string) => errors[key] ? <p id={`${key}-error`} className="text-destructive text-sm">{errors[key]}</p> : null
  const changeForeignTax = (value: typeof foreignTax) => {
    setForeignTax(value)
    setErrors(previous => previous.foreignTax ? { ...previous, foreignTax: "" } : previous)
  }
  const amountValue = Number(formData.amount)
  const breakdown = computeForeignTax(amountValue, foreignTax)
  const categoryName = categories.find(cat => String(cat.id) === selection.categoryId)?.nombre
  const paymentName = paymentMethods.find(method => String(method.id) === selection.paymentMethodId)?.nombre
  const customDate = pickDate || (formData.date !== today() && formData.date !== daysAgo(1))
  useEffect(() => {
    onDraftChange?.({ total: breakdown.total, categoryId: selection.categoryId ? Number(selection.categoryId) : null, categoryName, paymentName, date: formData.date, tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) })
  }, [onDraftChange, breakdown.total, selection.categoryId, categoryName, paymentName, formData.date, formData.tags])
  const ready = !optionsLoading && !optionsError && categories.length > 0 && paymentMethods.length > 0

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current || !ready) return
    const newErrors: Record<string, string> = {}
    let tags: string[] = []
    try { tags = parseExpenseTags(formData.tags) } catch (error) { newErrors.tags = (error as Error).message }
    const amount = Number(formData.amount)
    if (!formData.amount || !Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) newErrors.amount = "Ingresa un monto mayor a 0, con hasta 2 decimales"
    if (!formData.description.trim()) newErrors.description = "La descripción es obligatoria"
    if (!formData.date) newErrors.date = "La fecha es obligatoria"
    if (!selection.categoryId) newErrors.categoryId = "Selecciona una categoría"
    if (!selection.paymentMethodId) newErrors.paymentMethodId = "Selecciona un método de pago"
    const foreignError = validateForeignTax(foreignTax)
    if (foreignError) newErrors.foreignTax = foreignError
    setErrors(newErrors)
    setSubmitError(null)
    if (Object.keys(newErrors).length) {
      const first = Object.keys(newErrors)[0]
      if (first === 'tags' || first === 'foreignTax') {
        const details = formRef.current?.querySelector<HTMLDetailsElement>('#expense-extra-details')
        if (details) details.open = true
      }
      const id = first === 'tags' ? 'expense-tags' : first === 'categoryId' ? 'category' : first === 'paymentMethodId' ? 'paymentMethod' : first === 'foreignTax' ? 'foreign-enabled' : first
      formRef.current?.querySelector<HTMLElement>(`#${id}`)?.focus()
      return
    }
    const another = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'another'
    submitting.current = true
    setIsSubmitting(true)
    onSubmittingChange?.(true)
    const saved = { categoryId: parseInt(selection.categoryId), date: formData.date, total: computeForeignTax(amount, foreignTax).total }
    try {
      // Con "Compra en el exterior" se guarda el total que cobró el banco, impuestos incluidos.
      await create.mutateAsync({ descripcion: formData.description.trim(), monto: saved.total, categoria_id: parseInt(selection.categoryId), fecha: formData.date, metodo_pago_id: parseInt(selection.paymentMethodId), is_recurrent: false, tags: withForeignTag(tags, foreignTax), impuesto_exterior: storedForeignTax(amount, foreignTax) })
    } catch (error) {
      console.error("Error al agregar gasto:", error)
      setSubmitError("No se pudo guardar el gasto. Tus datos siguen aquí; vuelve a intentar.")
      return
    } finally {
      submitting.current = false
      setIsSubmitting(false)
      onSubmittingChange?.(false)
    }
    setFormData({ description: "", amount: "", categoryId: another ? selection.categoryId : "", date: another ? formData.date : today(), paymentMethodId: another ? selection.paymentMethodId : "", tags: "" })
    if (!another) setForeignTax(emptyForeignTax())
    setErrors({})
    toast.success("Gasto guardado")
    void warnBudgetCrossing(read, saved, expenses)
    if (another) requestAnimationFrame(() => amountRef.current?.focus())
    else onSuccess?.()
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="min-w-0 space-y-4">
      {optionsLoading && <p role="status" className="text-xs text-muted-foreground">Cargando categorías y métodos de pago…</p>}
      {optionsError && <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{optionsError}</p><Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={() => void loadOptions()}>Reintentar</Button></div>}
      {!optionsLoading && !optionsError && !ready && <p role="alert" className="text-sm text-muted-foreground">Necesitas al menos una categoría y un método de pago para registrar gastos.</p>}
      {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
      <fieldset disabled={isSubmitting} className="min-w-0 space-y-6">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground text-background"><ReceiptText className="size-5" /></span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-tight">Detalles del gasto</h2>
            <p className="text-sm text-muted-foreground">Monto, categoría y cómo lo pagaste.</p>
          </div>
        </div>

        <div className="space-y-2 min-w-0">
          <FieldLabel icon={DollarSign} htmlFor="amount">{foreignTax.enabled ? 'Precio sin impuestos' : 'Monto'} <span className="text-destructive">*</span></FieldLabel>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input controlSize="form" ref={amountRef} id="amount" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0.00" value={formData.amount} onChange={e => change('amount', e.target.value)} onWheel={e => e.currentTarget.blur()} aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? 'amount-error' : 'amount-hint'} className="pl-7 pr-14 font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
            <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">USD</span>
          </div>
          <div className="scrollbar-hidden -mx-1 flex flex-nowrap items-center gap-2 overflow-x-auto px-1 py-1">
            {QUICK_AMOUNTS.map(step => <button key={step} type="button" className={pill(false)} onClick={() => change('amount', String(Math.round(((Number.isFinite(amountValue) ? amountValue : 0) + step) * 100) / 100))}>+ {step}</button>)}
            {formData.amount && <button type="button" className="min-h-11 shrink-0 rounded-full px-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring" onClick={() => change('amount', '')}>Borrar</button>}
          </div>
          {errors.amount ? fieldError('amount') : <p id="amount-hint" className="text-xs text-muted-foreground">{foreignTax.enabled ? 'Los impuestos se suman al importe que registres.' : 'El importe total de tu compra.'}</p>}
        </div>

        <div role="group" aria-labelledby="date-label" className="space-y-2 min-w-0">
          <FieldLabel icon={CalendarDays} id="date-label">Fecha <span className="text-destructive">*</span></FieldLabel>
          <div className="flex flex-wrap items-center gap-2">
            {([['Hoy', 0], ['Ayer', 1]] as const).map(([label, days]) => {
              const value = daysAgo(days)
              return <button key={label} type="button" aria-pressed={!pickDate && formData.date === value} className={pill(!pickDate && formData.date === value)} onClick={() => { setPickDate(false); change('date', value) }}>{label} <span className="font-normal text-muted-foreground">{shortDate(value)}</span></button>
            })}
            <button type="button" aria-pressed={customDate} className={pill(customDate)} onClick={() => setPickDate(true)}>Otra fecha</button>
            {customDate && <Input controlSize="form" id="date" type="date" aria-label="Fecha del gasto" value={formData.date} onChange={e => change('date', e.target.value)} aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? 'date-error' : undefined} className="w-auto min-w-0 rounded-full dark:[color-scheme:dark]" />}
          </div>
          {fieldError('date')}
        </div>

        <div className="space-y-2 min-w-0">
          <FieldLabel icon={Pencil} htmlFor="description">Descripción <span className="text-destructive">*</span></FieldLabel>
          <Input controlSize="form" id="description" placeholder="Ej. Almuerzo, supermercado, gasolina" value={formData.description} onChange={e => change('description', e.target.value)} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'description-error' : 'description-hint'} />
          {errors.description ? fieldError('description') : <p id="description-hint" className="text-xs leading-relaxed text-muted-foreground">Sugerimos categoría y pago según tu historial.</p>}
        </div>

        <div className="space-y-2 min-w-0">
          <FieldLabel icon={LayoutGrid} id="category-label">Categoría <span className="text-destructive">*</span></FieldLabel>
          <ChipGroup id="category" labelledBy="category-label" value={selection.categoryId} onChange={value => change('categoryId', value)} invalid={Boolean(errors.categoryId)} describedBy={errors.categoryId ? 'categoryId-error' : suggestedCategory ? 'category-suggestion' : undefined}
            options={categories.map(cat => ({ value: String(cat.id), label: cat.nombre, icon: categoryIcon(cat.nombre), tone: categoryTone(cat.nombre) }))} />
          {suggestedCategory && <p id="category-suggestion" className="text-muted-foreground text-xs" role="status">Sugerida por tu historial. Puedes cambiarla.</p>}
          {fieldError('categoryId')}
        </div>

        <div className="space-y-2 min-w-0">
          <FieldLabel icon={CreditCard} id="paymentMethod-label">Método de pago <span className="text-destructive">*</span></FieldLabel>
          <ChipGroup id="paymentMethod" labelledBy="paymentMethod-label" value={selection.paymentMethodId} onChange={value => change('paymentMethodId', value)} invalid={Boolean(errors.paymentMethodId)} describedBy={errors.paymentMethodId ? 'paymentMethodId-error' : suggestedPayment ? 'payment-suggestion' : undefined}
            options={paymentMethods.map(method => ({ value: String(method.id), label: method.nombre, icon: paymentIcon(method.nombre) }))} />
          {suggestedPayment && <p id="payment-suggestion" className="text-muted-foreground text-xs" role="status">Sugerido por tu historial. Puedes cambiarlo.</p>}
          {fieldError('paymentMethodId')}
        </div>

        <details id="expense-extra-details" open className="group space-y-4">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            <span>Etiquetas y compra en el exterior <span className="ml-1 font-normal text-muted-foreground">· opcional</span></span>
            <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <div className="space-y-4 pt-2">
            <ExpenseTagsField value={formData.tags} onChange={value => change("tags", value)} error={errors.tags} />
            <ForeignTaxField base={amountValue} value={foreignTax} onChange={changeForeignTax} error={errors.foreignTax} />
          </div>
        </details>

        <div className="space-y-4 border-t border-border pt-5">
          <p aria-live="polite" className="text-sm text-muted-foreground xl:hidden">
            Vas a guardar <span className="font-semibold text-foreground tabular-nums">{formatMoney(breakdown.total)}</span>
            {breakdown.taxTotal > 0 && <> (incluye {formatMoney(breakdown.taxTotal)} de impuestos)</>}
            {categoryName && <> en <span className="font-medium text-foreground">{categoryName}</span></>}
            {paymentName && <> con <span className="font-medium text-foreground">{paymentName}</span></>}.
          </p>
          <div className="grid gap-2 sm:flex sm:justify-end sm:gap-3">
            <Button size="form" type="submit" value="save" disabled={!ready || isSubmitting}>{isSubmitting ? <><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />Guardando…</> : <>Guardar gasto<ArrowRight aria-hidden="true" className="size-4" /></>}</Button>
            <Button size="form" type="submit" value="another" variant="ghost" className="order-2 text-muted-foreground sm:order-first" disabled={!ready || isSubmitting} title="Guarda y deja la misma categoría, pago y fecha para registrar otro rápido">Guardar y agregar otro</Button>
          </div>
        </div>
      </fieldset>
    </form>
  )
}

/** Etiqueta de campo con ícono; sirve como <label> o como título de un grupo. */
function FieldLabel({ icon: Icon, htmlFor, id, children }: { icon: LucideIcon; htmlFor?: string; id?: string; children: React.ReactNode }) {
  const className = "flex items-center gap-2 text-sm font-medium text-muted-foreground"
  const content = <><Icon aria-hidden="true" className="size-3.5" />{children}</>
  return htmlFor ? <Label htmlFor={htmlFor} className={className}>{content}</Label> : <p id={id} className={className}>{content}</p>
}

/** Selección única como chips: todas las opciones a la vista, un clic en vez de abrir un menú. */
function ChipGroup({ id, labelledBy, value, onChange, options, invalid, describedBy }: {
  id: string
  labelledBy: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; icon?: LucideIcon; tone?: string }[]
  invalid: boolean
  describedBy?: string
}) {
  return (
    <div id={id} role="radiogroup" tabIndex={-1} aria-labelledby={labelledBy} aria-invalid={invalid} aria-describedby={describedBy}
      onKeyDown={event => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key) || options.length === 0) return
        event.preventDefault()
        const current = options.findIndex(option => option.value === value)
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
          : (Math.max(0, current) + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length
        onChange(options[next].value)
        event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus()
      }}
      className={`scrollbar-hidden -mx-1 flex flex-nowrap gap-2 overflow-x-auto rounded-lg px-1 py-1 outline-none ${invalid ? 'ring-1 ring-destructive ring-offset-4 ring-offset-card' : ''}`}>
      {options.map(option => {
        const active = option.value === value
        return (
          <button key={option.value} type="button" role="radio" aria-checked={active} tabIndex={active || (!value && option === options[0]) ? 0 : -1} onClick={() => onChange(option.value)} className={pill(active)}>
            {option.icon && <option.icon aria-hidden="true" className={`size-3.5 ${option.tone ?? ''}`} />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
