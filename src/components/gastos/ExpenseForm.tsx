"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { ArrowLeft, ArrowRight, Check, ChevronDown, LoaderCircle, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HorizontalScroll } from "@/components/ui/horizontal-scroll"
import { Button } from "@/components/ui/button"
import { ExpenseTagsField } from '@/components/gastos/ExpenseTags'
import { ForeignTaxField } from '@/components/gastos/ForeignTaxField'
import { computeForeignTax, emptyForeignTax, storedForeignTax, validateForeignTax, withForeignTag } from '@/lib/foreign-tax'
import { formatMoney } from '@/lib/utils'
import { parseExpenseTags } from '@/lib/expense-tags'
import { categoryIcon, categoryTone, paymentIcon } from '@/lib/expense-icons'
import { ExpenseDraftSummary, type ExpenseDraft } from '@/components/gastos/ExpenseDraftSummary'
import { createExpense } from "@/services/expenses"
import { fetchBudgetsByYear } from "@/services/budget-general"
import { fetchPresupuestoCategorias } from "@/services/budget"
import { budgetCrossing, categoryUsage } from "@/lib/month-planning"
import { useExpenseCatalogs } from "@/hooks/useExpenseQueries"
import { useRemoteMutation, useCachedRead, type CachedRead } from "@/hooks/useRemoteData"
import { queryKeys } from "@/lib/query/client"
import { predictExpenseSelection, resolveExpenseSelection, type SuggestionHistory } from "@/lib/expense-suggestions"

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]
const pill = (active: boolean) => `inline-flex shrink-0 whitespace-nowrap min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition-[color,background-color,border-color,scale] duration-150 ease-out active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-ring ${active ? 'border-foreground bg-card font-medium text-foreground' : 'border-input bg-card text-muted-foreground hover:bg-accent hover:text-foreground'}`

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

export function ExpenseForm({ history = [], expenses = [], onDraftChange, onSuccess, onCancel, onSubmittingChange }: { fetchExpenses: () => void | Promise<void>; history?: readonly SuggestionHistory[]; expenses?: readonly { categoria_id: number; monto: number; fecha: string }[]; onDraftChange?: (draft: ExpenseDraft) => void; onSuccess?: () => void; onCancel?: () => void; onSubmittingChange?: (busy: boolean) => void }) {
  const [formData, setFormData] = useState({ description: "", amount: "", categoryId: "", date: today(), paymentMethodId: "", tags: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitting = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const reviewRef = useRef<HTMLHeadingElement>(null)
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
  const [step, setStep] = useState<"details" | "review">("details")
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
  let summaryTags: string[] = []
  try { summaryTags = withForeignTag(parseExpenseTags(formData.tags), foreignTax) } catch { /* validation explains invalid tags before review */ }
  const draft: ExpenseDraft = { description: formData.description.trim(), total: breakdown.total, base: amountValue, taxTotal: breakdown.taxTotal, categoryId: selection.categoryId ? Number(selection.categoryId) : null, categoryName, paymentName, date: formData.date, tags: summaryTags }
  useEffect(() => {
    onDraftChange?.({ total: breakdown.total, categoryId: selection.categoryId ? Number(selection.categoryId) : null, categoryName, paymentName, date: formData.date, tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) })
  }, [onDraftChange, breakdown.total, selection.categoryId, categoryName, paymentName, formData.date, formData.tags])
  const ready = !optionsLoading && !optionsError && categories.length > 0 && paymentMethods.length > 0
  const focusStep = (target: HTMLElement | null) => {
    formRef.current?.querySelectorAll<HTMLElement>('[data-expense-scroll-area]').forEach(area => area.scrollTo({ top: 0 }))
    target?.focus({ preventScroll: true })
  }

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
      setStep("details")
      const first = Object.keys(newErrors)[0]
      if (first === 'tags' || first === 'foreignTax') {
        const details = formRef.current?.querySelector<HTMLDetailsElement>('#expense-extra-details')
        if (details) details.open = true
      }
      const id = first === 'tags' ? 'expense-tags' : first === 'categoryId' ? 'category' : first === 'paymentMethodId' ? 'paymentMethod' : first === 'foreignTax' ? 'foreign-enabled' : first
      const focusError = () => formRef.current?.querySelector<HTMLElement>(`#${id}`)?.focus()
      if (step === "review") requestAnimationFrame(focusError)
      else focusError()
      return
    }
    if (step === "details") {
      setStep("review")
      requestAnimationFrame(() => focusStep(reviewRef.current))
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
    setStep("details")
    toast.success("Gasto guardado")
    void warnBudgetCrossing(read, saved, expenses)
    if (another) requestAnimationFrame(() => focusStep(amountRef.current))
    else onSuccess?.()
  }

  const goDetails = () => { setStep("details"); requestAnimationFrame(() => focusStep(amountRef.current)) }
  const stepClass = (active: boolean) => active ? "flex min-h-0 flex-1 flex-col" : "hidden"

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="flex min-h-0 min-w-0 flex-1 flex-col">
      <fieldset disabled={isSubmitting} className="contents">
        <nav aria-label="Pasos del registro" className="shrink-0 border-b bg-muted/40 px-5 py-1.5 sm:px-7 sm:py-3">
          <ol className="flex items-center gap-3">
            <li aria-current={step === "details" ? "step" : undefined}>
              <button type="button" disabled={isSubmitting} onClick={goDetails} className="flex min-h-9 items-center gap-2 rounded-md text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-ring">
                <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-xs text-background">{step === "review" ? <Check className="size-3.5" /> : "1"}</span>Detalles
              </button>
            </li>
            <li aria-hidden="true" className="h-px flex-1 bg-border" />
            <li aria-current={step === "review" ? "step" : undefined} className={`flex min-h-9 items-center gap-2 text-[13px] font-medium ${step === "review" ? "text-foreground" : "text-muted-foreground"}`}>
              <span aria-hidden="true" className={`grid size-6 shrink-0 place-items-center rounded-full text-xs ${step === "review" ? "bg-foreground text-background" : "border bg-card"}`}>2</span>Resumen
            </li>
          </ol>
          <p className="sr-only" role="status">Paso {step === "details" ? "1" : "2"} de 2: {step === "details" ? "Detalles" : "Resumen"}</p>
        </nav>
        {(optionsLoading || optionsError || submitError || (!optionsLoading && !ready)) && <div className="shrink-0 space-y-2 px-5 pt-4 sm:px-7">
          {optionsLoading && <p role="status" className="text-xs text-muted-foreground">Cargando categorías y métodos de pago…</p>}
          {optionsError && <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{optionsError}</p><Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={() => void loadOptions()}>Reintentar</Button></div>}
          {!optionsLoading && !optionsError && !ready && <p role="alert" className="text-sm text-muted-foreground">Necesitas al menos una categoría y un método de pago para registrar gastos.</p>}
          {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
        </div>}

        <div hidden={step !== "details"} className={stepClass(step === "details")}>
          <div data-expense-scroll-area="" className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 sm:space-y-5 sm:py-5 sm:px-7">
            <div className="grid grid-cols-2 items-start gap-3 sm:gap-5">
              <div className="min-w-0 space-y-2">
                <FieldLabel htmlFor="amount">{foreignTax.enabled ? 'Precio sin impuestos' : 'Monto'}</FieldLabel>
                <div className="relative">
                  <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input controlSize="form" ref={amountRef} id="amount" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0.00" value={formData.amount} onChange={e => change('amount', e.target.value)} onWheel={e => e.currentTarget.blur()} aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? 'amount-error' : 'amount-hint'} className="pl-7 pr-2 font-semibold tabular-nums sm:pr-14 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                  <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 text-xs font-medium text-muted-foreground sm:block">USD</span>
                </div>
                {errors.amount ? fieldError('amount') : <p id="amount-hint" className="hidden text-xs text-muted-foreground sm:block">{foreignTax.enabled ? 'Los impuestos se suman al importe que registres.' : 'El importe total de tu compra.'}</p>}
              </div>
              <div className="min-w-0 space-y-2">
                <FieldLabel htmlFor="date">Fecha</FieldLabel>
                <Input controlSize="form" id="date" type="date" value={formData.date} onChange={e => change('date', e.target.value)} aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? 'date-error' : undefined} className="w-full min-w-0 px-2 text-[13px] dark:[color-scheme:dark]" />
                {fieldError('date')}
              </div>
            </div>

            <div className="min-w-0 space-y-2">
              <FieldLabel htmlFor="description">Descripción</FieldLabel>
              <Input controlSize="form" id="description" placeholder="Ej. Almuerzo, supermercado, gasolina" value={formData.description} onChange={e => change('description', e.target.value)} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'description-error' : 'description-hint'} />
              {errors.description ? fieldError('description') : <p id="description-hint" className="text-xs leading-relaxed text-muted-foreground">Sugerimos categoría y pago según tu historial.</p>}
            </div>

            <div className="min-w-0 space-y-2">
              <FieldLabel id="category-label">Categoría</FieldLabel>
              <ChipGroup id="category" labelledBy="category-label" value={selection.categoryId} onChange={value => change('categoryId', value)} invalid={Boolean(errors.categoryId)} describedBy={errors.categoryId ? 'categoryId-error' : suggestedCategory ? 'category-suggestion' : undefined}
                options={categories.map(cat => ({ value: String(cat.id), label: cat.nombre, icon: categoryIcon(cat.nombre), tone: categoryTone(cat.nombre) }))} />
              {suggestedCategory && <p id="category-suggestion" className="text-muted-foreground text-xs" role="status">Sugerida por tu historial. Puedes cambiarla.</p>}
              {fieldError('categoryId')}
            </div>

            <div className="min-w-0 space-y-2">
              <FieldLabel id="paymentMethod-label">Método de pago</FieldLabel>
              <ChipGroup id="paymentMethod" labelledBy="paymentMethod-label" value={selection.paymentMethodId} onChange={value => change('paymentMethodId', value)} invalid={Boolean(errors.paymentMethodId)} describedBy={errors.paymentMethodId ? 'paymentMethodId-error' : suggestedPayment ? 'payment-suggestion' : undefined}
                options={paymentMethods.map(method => ({ value: String(method.id), label: method.nombre, icon: paymentIcon(method.nombre) }))} />
              {suggestedPayment && <p id="payment-suggestion" className="text-muted-foreground text-xs" role="status">Sugerido por tu historial. Puedes cambiarlo.</p>}
              {fieldError('paymentMethodId')}
            </div>

            <details id="expense-extra-details" className="group space-y-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                <span>Etiquetas y compra en el exterior <span className="ml-1 font-normal text-muted-foreground">· opcional</span></span>
                <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" />
              </summary>
              <div className="space-y-4 pt-2">
                <ExpenseTagsField value={formData.tags} onChange={value => change("tags", value)} error={errors.tags} />
                <ForeignTaxField base={amountValue} value={foreignTax} onChange={changeForeignTax} error={errors.foreignTax} />
              </div>
            </details>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-card px-5 py-3 sm:px-7 sm:py-4">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-semibold leading-tight tabular-nums">{formatMoney(breakdown.total)}</p>
            </div>
            <div className="flex items-center gap-2">
              {onCancel && <Button size="form" type="button" variant="outline" className="hidden sm:inline-flex" disabled={isSubmitting} onClick={onCancel}>Cancelar</Button>}
              <Button size="form" type="submit" disabled={!ready || isSubmitting}>Continuar<ArrowRight aria-hidden="true" className="size-4" /></Button>
            </div>
          </div>
        </div>

        <section hidden={step !== "review"} aria-label="Resumen del gasto" className={stepClass(step === "review")}>
          <div data-expense-scroll-area="" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
            <h2 ref={reviewRef} tabIndex={-1} className="sr-only">Revisa tu gasto antes de guardar</h2>
            <ExpenseDraftSummary draft={draft} expenses={expenses} />
          </div>
          <div className="shrink-0 space-y-2 border-t bg-card px-5 py-3 sm:px-7 sm:py-4">
            <div className="grid grid-cols-2 gap-2">
              <Button size="form" type="button" variant="outline" disabled={isSubmitting} onClick={goDetails}><ArrowLeft aria-hidden="true" className="size-4" />Volver a datos</Button>
              <Button size="form" type="submit" value="save" disabled={!ready || isSubmitting}>{isSubmitting ? <><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />Guardando…</> : <>Guardar gasto<ArrowRight aria-hidden="true" className="size-4" /></>}</Button>
            </div>
            <Button size="form" type="submit" value="another" variant="ghost" className="w-full text-muted-foreground" disabled={!ready || isSubmitting} title="Guarda y deja la misma categoría, pago y fecha para registrar otro rápido">Guardar y agregar otro</Button>
          </div>
        </section>
      </fieldset>
    </form>
  )
}

/** Etiqueta de campo; sirve como <label> o como título de un grupo. */
function FieldLabel({ htmlFor, id, children }: { htmlFor?: string; id?: string; children: React.ReactNode }) {
  const className = "text-sm font-medium"
  return htmlFor ? <Label htmlFor={htmlFor} className={className}>{children}</Label> : <p id={id} className={className}>{children}</p>
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
    <HorizontalScroll id={id} role="radiogroup" tabIndex={-1} aria-labelledby={labelledBy} aria-invalid={invalid} aria-describedby={describedBy}
      onKeyDown={event => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key) || options.length === 0) return
        event.preventDefault()
        const current = options.findIndex(option => option.value === value)
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
          : (Math.max(0, current) + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length
        onChange(options[next].value)
        event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus()
      }}
      className={`-mx-1 flex flex-nowrap gap-2 rounded-lg px-1 py-1 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${invalid ? 'ring-1 ring-destructive ring-offset-4 ring-offset-card' : ''}`}>
      {options.map(option => {
        const active = option.value === value
        return (
          <button key={option.value} type="button" role="radio" aria-checked={active} tabIndex={active || (!value && option === options[0]) ? 0 : -1} onClick={() => onChange(option.value)} className={pill(active)}>
            {option.icon && <option.icon aria-hidden="true" className={`size-3.5 ${option.tone ?? ''}`} />}
            {option.label}
          </button>
        )
      })}
    </HorizontalScroll>
  )
}
