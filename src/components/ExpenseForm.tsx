"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { LoaderCircle } from "lucide-react"
import toast from "react-hot-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createExpense } from "@/services/expenses"
import { fetchCategories, type Category } from "@/services/categories"
import { fetchPaymentMethods, type PaymentMethod } from "@/services/paymentMethods"
import { predictExpenseSelection, resolveExpenseSelection, type SuggestionHistory } from "@/lib/expense-suggestions"

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]

export function ExpenseForm({ fetchExpenses, history = [] }: { fetchExpenses: () => void | Promise<void>; history?: readonly SuggestionHistory[] }) {
  const [formData, setFormData] = useState({ description: "", amount: "", categoryId: "", date: today(), paymentMethodId: "" })
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
  const ready = !optionsLoading && !optionsError && categories.length > 0 && paymentMethods.length > 0

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current || !ready) return
    const newErrors: Record<string, string> = {}
    const amount = Number(formData.amount)
    if (!formData.amount || !Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) newErrors.amount = "Ingresa un monto mayor a 0, con hasta 2 decimales"
    if (!formData.description.trim()) newErrors.description = "La descripción es obligatoria"
    if (!formData.date) newErrors.date = "La fecha es obligatoria"
    if (!selection.categoryId) newErrors.categoryId = "Selecciona una categoría"
    if (!selection.paymentMethodId) newErrors.paymentMethodId = "Selecciona un método de pago"
    setErrors(newErrors)
    setSubmitError(null)
    if (Object.keys(newErrors).length) {
      const first = Object.keys(newErrors)[0]
      const id = first === 'categoryId' ? 'category' : first === 'paymentMethodId' ? 'paymentMethod' : first
      formRef.current?.querySelector<HTMLElement>(`#${id}`)?.focus()
      return
    }
    const another = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'another'
    submitting.current = true
    setIsSubmitting(true)
    try {
      await createExpense({ descripcion: formData.description.trim(), monto: amount, categoria_id: parseInt(selection.categoryId), fecha: formData.date, metodo_pago_id: parseInt(selection.paymentMethodId), is_recurrent: false })
    } catch (error) {
      console.error("Error al agregar gasto:", error)
      setSubmitError("No se pudo guardar el gasto. Tus datos siguen aquí; vuelve a intentar.")
      return
    } finally {
      submitting.current = false
      setIsSubmitting(false)
    }
    setFormData({ description: "", amount: "", categoryId: another ? selection.categoryId : "", date: another ? formData.date : today(), paymentMethodId: another ? selection.paymentMethodId : "" })
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
      <fieldset disabled={isSubmitting} className="space-y-5 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 min-w-0">
            <Label htmlFor="amount">Monto (USD) <span className="text-destructive">*</span></Label>
            <div className="relative"><span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input ref={amountRef} id="amount" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0.00" value={formData.amount} onChange={e => change('amount', e.target.value)} aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? 'amount-error' : undefined} className={`pl-7 h-11 text-base tabular-nums ${errors.amount ? 'border-destructive' : ''}`} />
            </div>{fieldError('amount')}
          </div>
          <div className="space-y-2 min-w-0">
            <Label htmlFor="date">Fecha <span className="text-destructive">*</span></Label>
            <Input id="date" type="date" value={formData.date} onChange={e => change('date', e.target.value)} aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? 'date-error' : undefined} className={`h-11 text-base sm:text-sm min-w-0 dark:[color-scheme:dark] ${errors.date ? 'border-destructive' : ''}`} />
            {fieldError('date')}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descripción <span className="text-destructive">*</span></Label>
          <Textarea id="description" placeholder="Ej. Almuerzo, gasolina, supermercado" value={formData.description} onChange={e => change('description', e.target.value)} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'description-error' : undefined} rows={2} className={`min-h-[72px] text-base sm:text-sm ${errors.description ? 'border-destructive' : ''}`} />
          {fieldError('description')}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 min-w-0">
            <Label htmlFor="category">Categoría <span className="text-destructive">*</span></Label>
            <Select value={selection.categoryId} disabled={optionsLoading || Boolean(optionsError)} onValueChange={value => change('categoryId', value)}>
              <SelectTrigger id="category" aria-invalid={Boolean(errors.categoryId)} aria-describedby={errors.categoryId ? 'categoryId-error' : suggestedCategory ? 'category-suggestion' : undefined} className={`h-11 ${errors.categoryId ? 'border-destructive' : ''}`}><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
              <SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.nombre}</SelectItem>)}</SelectContent>
            </Select>
            {suggestedCategory && <p id="category-suggestion" className="text-muted-foreground text-xs" role="status">Sugerida por tu historial. Puedes cambiarla.</p>}
            {fieldError('categoryId')}
          </div>
          <div className="space-y-2 min-w-0">
            <Label htmlFor="paymentMethod">Método de pago <span className="text-destructive">*</span></Label>
            <Select value={selection.paymentMethodId} disabled={optionsLoading || Boolean(optionsError)} onValueChange={value => change('paymentMethodId', value)}>
              <SelectTrigger id="paymentMethod" aria-invalid={Boolean(errors.paymentMethodId)} aria-describedby={errors.paymentMethodId ? 'paymentMethodId-error' : suggestedPayment ? 'payment-suggestion' : undefined} className={`h-11 ${errors.paymentMethodId ? 'border-destructive' : ''}`}><SelectValue placeholder="¿Cómo pagaste?" /></SelectTrigger>
              <SelectContent>{paymentMethods.map(method => <SelectItem key={method.id} value={String(method.id)}>{method.nombre}</SelectItem>)}</SelectContent>
            </Select>
            {suggestedPayment && <p id="payment-suggestion" className="text-muted-foreground text-xs" role="status">Sugerido por tu historial. Puedes cambiarlo.</p>}
            {fieldError('paymentMethodId')}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button type="submit" value="save" disabled={!ready || isSubmitting} className="h-11 flex-1">{isSubmitting ? <><LoaderCircle aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />Guardando…</> : 'Guardar gasto'}</Button>
          <Button type="submit" value="another" variant="outline" disabled={!ready || isSubmitting} className="h-11 flex-1">Guardar y agregar otro</Button>
        </div>
      </fieldset>
    </form>
  )
}
