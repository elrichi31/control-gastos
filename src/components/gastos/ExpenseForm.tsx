"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { LoaderCircle } from "lucide-react"
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
import { fetchCategories, type Category } from "@/services/categories"
import { fetchPaymentMethods, type PaymentMethod } from "@/services/paymentMethods"
import { predictExpenseSelection, resolveExpenseSelection, type SuggestionHistory } from "@/lib/expense-suggestions"

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]

export function ExpenseForm({ fetchExpenses, history = [] }: { fetchExpenses: () => void | Promise<void>; history?: readonly SuggestionHistory[] }) {
  const [formData, setFormData] = useState({ description: "", amount: "", categoryId: "", date: today(), paymentMethodId: "", tags: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitting = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)
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

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true)
    setOptionsError(null)
    try {
      const [cats, methods] = await Promise.all([fetchCategories(), fetchPaymentMethods()])
      setCategories(cats)
      setPaymentMethods(methods)
    } catch (error) {
      console.error("Error al cargar opciones de gasto:", error)
      setOptionsError("No se pudieron cargar las categorías y métodos de pago.")
    } finally { setOptionsLoading(false) }
  }, [])
  useEffect(() => { void loadOptions() }, [loadOptions])

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
      const id = first === 'tags' ? 'expense-tags' : first === 'categoryId' ? 'category' : first === 'paymentMethodId' ? 'paymentMethod' : first === 'foreignTax' ? 'foreign-enabled' : first
      formRef.current?.querySelector<HTMLElement>(`#${id}`)?.focus()
      return
    }
    const another = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'another'
    submitting.current = true
    setIsSubmitting(true)
    try {
      // Con "Compra en el exterior" se guarda el total que cobró el banco, impuestos incluidos.
      await createExpense({ descripcion: formData.description.trim(), monto: computeForeignTax(amount, foreignTax).total, categoria_id: parseInt(selection.categoryId), fecha: formData.date, metodo_pago_id: parseInt(selection.paymentMethodId), is_recurrent: false, tags: withForeignTag(tags, foreignTax), impuesto_exterior: storedForeignTax(amount, foreignTax) })
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
    if (another) requestAnimationFrame(() => amountRef.current?.focus())
    try { await fetchExpenses() } catch (error) {
      console.error("Error al actualizar gastos:", error)
      toast.error("El gasto se guardó, pero no se pudo actualizar la lista. No lo registres de nuevo.")
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="space-y-4">
      {optionsLoading && <p role="status" className="text-xs text-muted-foreground">Cargando categorías y métodos de pago…</p>}
      {optionsError && <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{optionsError}</p><Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={() => void loadOptions()}>Reintentar</Button></div>}
      {!optionsLoading && !optionsError && !ready && <p role="alert" className="text-sm text-muted-foreground">Necesitas al menos una categoría y un método de pago para registrar gastos.</p>}
      {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
      <fieldset disabled={isSubmitting} className="space-y-6 min-w-0">
        <Section step={1} title="¿Cuánto gastaste y en qué?">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[11rem_minmax(0,1fr)_10rem]">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="amount">{foreignTax.enabled ? 'Precio sin impuestos' : 'Monto (USD)'} <span className="text-destructive">*</span></Label>
              <div className="relative">
                <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input controlSize="form" ref={amountRef} id="amount" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0.00" value={formData.amount} onChange={e => change('amount', e.target.value)} aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? 'amount-error' : undefined} className="pl-7 font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
              </div>
              {fieldError('amount')}
            </div>
            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="description">Descripción <span className="text-destructive">*</span></Label>
              <Input controlSize="form" id="description" placeholder="Ej. Almuerzo, gasolina, Netflix" value={formData.description} onChange={e => change('description', e.target.value)} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'description-error' : 'description-hint'} />
              {errors.description ? fieldError('description') : <p id="description-hint" className="text-xs text-muted-foreground">Al escribir, sugerimos categoría y pago según tus gastos anteriores.</p>}
            </div>
            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="date">Fecha <span className="text-destructive">*</span></Label>
              <Input controlSize="form" id="date" type="date" value={formData.date} onChange={e => change('date', e.target.value)} aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? 'date-error' : undefined} className="min-w-0 dark:[color-scheme:dark]" />
              {fieldError('date')}
            </div>
          </div>
        </Section>

        <Section step={2} title="Clasifícalo">
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

        <Section step={3} title="Detalles extra" optional>
          <ForeignTaxField base={amountValue} value={foreignTax} onChange={changeForeignTax} error={errors.foreignTax} />
          <ExpenseTagsField value={formData.tags} onChange={value => change("tags", value)} error={errors.tags} />
        </Section>

        <div className="space-y-3 border-t pt-4">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Vas a guardar <span className="font-semibold text-foreground tabular-nums">{formatMoney(breakdown.total)}</span>
            {breakdown.taxTotal > 0 && <> (incluye {formatMoney(breakdown.taxTotal)} de impuestos)</>}
            {categoryName && <> en <span className="font-medium text-foreground">{categoryName}</span></>}
            {paymentName && <> con <span className="font-medium text-foreground">{paymentName}</span></>}.
          </p>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button size="form" type="submit" value="another" variant="outline" disabled={!ready || isSubmitting} title="Guarda y deja la misma categoría, pago y fecha para registrar otro rápido">Guardar y agregar otro</Button>
            <Button size="form" type="submit" value="save" disabled={!ready || isSubmitting}>{isSubmitting ? <><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />Guardando…</> : 'Guardar gasto'}</Button>
          </div>
        </div>
      </fieldset>
    </form>
  )
}

/** Bloque numerado: deja claro qué es obligatorio y en qué orden llenarlo. */
function Section({ step, title, optional, children }: { step: number; title: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="space-y-3 min-w-0">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">{step}</span>
        {title}
        {optional && <span className="font-normal text-muted-foreground">(opcional)</span>}
      </h3>
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
      className={`flex flex-wrap gap-1.5 rounded-lg outline-none ${invalid ? 'ring-1 ring-destructive ring-offset-4 ring-offset-card' : ''}`}>
      {options.map(option => {
        const active = option.value === value
        return (
          <button key={option.value} type="button" role="radio" aria-checked={active} onClick={() => onChange(option.value)}
            className={`inline-flex h-8 items-center rounded-lg border px-3 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-ring ${active
              ? option.color ?? 'border-primary/40 bg-primary/15 text-primary'
              : 'border-input bg-card text-muted-foreground hover:bg-accent hover:text-foreground'} ${active ? 'font-medium' : ''}`}>
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
