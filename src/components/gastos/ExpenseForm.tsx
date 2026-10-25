"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { ArrowRight, ChevronDown, LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ExpenseTagsField } from '@/components/gastos/ExpenseTags'
import { ForeignTaxField } from '@/components/gastos/ForeignTaxField'
import { computeForeignTax, emptyForeignTax, storedForeignTax, validateForeignTax, withForeignTag } from '@/lib/foreign-tax'
import { formatMoney } from '@/lib/utils'
import { parseExpenseTags } from '@/lib/expense-tags'
import { getCategoriaColor } from '@/lib/constants'
import { createExpense } from "@/services/expenses"
import { fetchBudgetsByYear } from "@/services/budget-general"
import { fetchPresupuestoCategorias } from "@/services/budget"
import { budgetCrossing, categoryUsage } from "@/lib/month-planning"
import { useExpenseCatalogs } from "@/hooks/useExpenseQueries"
import { useRemoteMutation, useCachedRead, type CachedRead } from "@/hooks/useRemoteData"
import { queryKeys } from "@/lib/query/client"
import { predictExpenseSelection, resolveExpenseSelection, type SuggestionHistory } from "@/lib/expense-suggestions"

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]

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

export function ExpenseForm({ history = [], expenses = [] }: { fetchExpenses: () => void | Promise<void>; history?: readonly SuggestionHistory[]; expenses?: readonly { categoria_id: number; monto: number; fecha: string }[] }) {
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
    }
    setFormData({ description: "", amount: "", categoryId: another ? selection.categoryId : "", date: another ? formData.date : today(), paymentMethodId: another ? selection.paymentMethodId : "", tags: "" })
    if (!another) setForeignTax(emptyForeignTax())
    setErrors({})
    toast.success("Gasto guardado")
    void warnBudgetCrossing(read, saved, expenses)
    if (another) requestAnimationFrame(() => amountRef.current?.focus())
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="space-y-4">
      {optionsLoading && <p role="status" className="text-xs text-muted-foreground">Cargando categorías y métodos de pago…</p>}
      {optionsError && <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{optionsError}</p><Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={() => void loadOptions()}>Reintentar</Button></div>}
      {!optionsLoading && !optionsError && !ready && <p role="alert" className="text-sm text-muted-foreground">Necesitas al menos una categoría y un método de pago para registrar gastos.</p>}
      {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
      <fieldset disabled={isSubmitting} className="min-w-0 space-y-6 sm:space-y-7">
        <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-5 sm:px-6 sm:py-6">
          <Label htmlFor="amount" className="text-sm font-medium text-muted-foreground">{foreignTax.enabled ? 'Precio sin impuestos' : '¿Cuánto gastaste?'} <span className="text-destructive">*</span></Label>
          <div className="mt-2 flex min-w-0 items-center gap-2">
            <span aria-hidden="true" className="text-3xl font-normal text-primary sm:text-4xl">$</span>
            <Input controlSize="form" ref={amountRef} id="amount" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0.00" value={formData.amount} onChange={e => change('amount', e.target.value)} aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? 'amount-error' : 'amount-hint'} className="h-16 min-w-0 max-w-full border-0 bg-transparent px-2 text-5xl font-semibold tracking-tight shadow-none tabular-nums placeholder:text-muted-foreground/40 focus-visible:ring-2 sm:h-20 sm:text-6xl md:text-6xl [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
            <span className="shrink-0 self-end pb-4 text-xs font-medium text-muted-foreground sm:pb-5">USD</span>
          </div>
          {errors.amount ? fieldError('amount') : <p id="amount-hint" className="mt-1 text-xs text-muted-foreground">{foreignTax.enabled ? 'Los impuestos se suman al importe que registres.' : 'El importe total de tu compra.'}</p>}
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_11rem] sm:gap-5">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="description">¿En qué lo gastaste? <span className="text-destructive">*</span></Label>
            <Input controlSize="form" id="description" placeholder="Ej. Almuerzo, supermercado, gasolina" value={formData.description} onChange={e => change('description', e.target.value)} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'description-error' : 'description-hint'} />
            {errors.description ? fieldError('description') : <p id="description-hint" className="text-xs leading-relaxed text-muted-foreground">Sugerimos categoría y pago según tu historial.</p>}
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="date">Fecha <span className="text-destructive">*</span></Label>
            <Input controlSize="form" id="date" type="date" value={formData.date} onChange={e => change('date', e.target.value)} aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? 'date-error' : undefined} className="min-w-0 dark:[color-scheme:dark]" />
            {fieldError('date')}
          </div>
        </div>

        <Section title="Categoría y pago">
          <div className="space-y-1.5 min-w-0">
            <p id="category-label" className="text-sm font-medium">Categoría <span className="text-destructive">*</span></p>
            <ChipGroup id="category" labelledBy="category-label" value={selection.categoryId} onChange={value => change('categoryId', value)} invalid={Boolean(errors.categoryId)} describedBy={errors.categoryId ? 'categoryId-error' : suggestedCategory ? 'category-suggestion' : undefined}
              options={categories.map(cat => ({ value: String(cat.id), label: cat.nombre, color: getCategoriaColor(cat.nombre) }))} />
            {suggestedCategory && <p id="category-suggestion" className="text-muted-foreground text-xs" role="status">Sugerida por tu historial. Puedes cambiarla.</p>}
            {fieldError('categoryId')}
          </div>

          <div className="space-y-1.5 min-w-0">
            <p id="paymentMethod-label" className="text-sm font-medium">Método de pago <span className="text-destructive">*</span></p>
            <ChipGroup id="paymentMethod" labelledBy="paymentMethod-label" value={selection.paymentMethodId} onChange={value => change('paymentMethodId', value)} invalid={Boolean(errors.paymentMethodId)} describedBy={errors.paymentMethodId ? 'paymentMethodId-error' : suggestedPayment ? 'payment-suggestion' : undefined}
              options={paymentMethods.map(method => ({ value: String(method.id), label: method.nombre }))} />
            {suggestedPayment && <p id="payment-suggestion" className="text-muted-foreground text-xs" role="status">Sugerido por tu historial. Puedes cambiarlo.</p>}
            {fieldError('paymentMethodId')}
          </div>
        </Section>

        <details id="expense-extra-details" className="group rounded-xl border border-border px-4 sm:px-5">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            <span>Detalles extra <span className="ml-1 font-normal text-muted-foreground">· opcional</span></span>
            <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <div className="space-y-4 pb-5 pt-2">
            <ForeignTaxField base={amountValue} value={foreignTax} onChange={changeForeignTax} error={errors.foreignTax} />
            <ExpenseTagsField value={formData.tags} onChange={value => change("tags", value)} error={errors.tags} />
          </div>
        </details>

        <div className="space-y-4 border-t border-border pt-5">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Vas a guardar <span className="font-semibold text-foreground tabular-nums">{formatMoney(breakdown.total)}</span>
            {breakdown.taxTotal > 0 && <> (incluye {formatMoney(breakdown.taxTotal)} de impuestos)</>}
            {categoryName && <> en <span className="font-medium text-foreground">{categoryName}</span></>}
            {paymentName && <> con <span className="font-medium text-foreground">{paymentName}</span></>}.
          </p>
          <div className="grid gap-2 sm:flex sm:justify-end sm:gap-3">
            <Button size="form" type="submit" value="another" variant="ghost" className="order-2 text-muted-foreground sm:order-none" disabled={!ready || isSubmitting} title="Guarda y deja la misma categoría, pago y fecha para registrar otro rápido">Guardar y agregar otro</Button>
            <Button size="form" type="submit" value="save" disabled={!ready || isSubmitting}>{isSubmitting ? <><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />Guardando…</> : <>Guardar gasto<ArrowRight aria-hidden="true" className="size-4" /></>}</Button>
          </div>
        </div>
      </fieldset>
    </form>
  )
}

/** Agrupa las elecciones sin competir con el importe principal. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="space-y-3 min-w-0">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        {title}
      </h2>
      {children}
    </section>
  )
}

/** Selección única como chips: todas las opciones a la vista, un clic en vez de abrir un menú. */
function ChipGroup({ id, labelledBy, value, onChange, options, invalid, describedBy }: {
  id: string
  labelledBy: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; color?: string }[]
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
      className={`flex flex-wrap gap-1.5 rounded-lg outline-none ${invalid ? 'ring-1 ring-destructive ring-offset-4 ring-offset-card' : ''}`}>
      {options.map(option => {
        const active = option.value === value
        return (
          <button key={option.value} type="button" role="radio" aria-checked={active} tabIndex={active || (!value && option === options[0]) ? 0 : -1} onClick={() => onChange(option.value)}
            className={`inline-flex min-h-11 items-center rounded-lg border px-3.5 py-2 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-ring ${active
              ? option.color ?? 'border-primary/40 bg-primary/15 text-primary'
              : 'border-input bg-card text-muted-foreground hover:bg-accent hover:text-foreground'} ${active ? 'font-medium' : ''}`}>
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
