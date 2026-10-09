"use client"

import { useEffect, useRef, useState } from "react"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExpenseTagsField } from "@/components/gastos/ExpenseTags"
import { ForeignTaxField } from "@/components/gastos/ForeignTaxField"
import { FOREIGN_EXPENSE_TAG, computeForeignTax, foreignTaxFromStored, parseStoredForeignTax, storedForeignTax, validateForeignTax, withForeignTag } from "@/lib/foreign-tax"
import { parseExpenseTags } from "@/lib/expense-tags"
import { updateExpense } from "@/services/expenses"
import { fetchCategories, type Category } from "@/services/categories"
import { fetchPaymentMethods, type PaymentMethod } from "@/services/paymentMethods"
import type { Gasto } from "@/hooks/useGastosFiltrados"

type Props = { expense: Gasto; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void | Promise<void> }

const fromExpense = (expense: Gasto) => ({
  description: expense.descripcion,
  // Con compra en el exterior se edita el precio original; el total se recalcula al guardar.
  amount: String(parseStoredForeignTax(expense.impuesto_exterior)?.base ?? expense.monto),
  date: expense.fecha.slice(0, 10),
  categoryId: String(expense.categoria_id ?? expense.categoria?.id ?? ""),
  paymentMethodId: expense.metodo_pago?.id ? String(expense.metodo_pago.id) : "",
  tags: (expense.tags ?? []).join(", "),
})

export function EditExpenseDialog({ expense, open, onOpenChange, onSaved }: Props) {
  const [formData, setFormData] = useState(() => fromExpense(expense))
  const [foreignTax, setForeignTax] = useState(() => foreignTaxFromStored(expense.impuesto_exterior))
  const hadStoredTax = parseStoredForeignTax(expense.impuesto_exterior) !== null
  // Gastos marcados #exterior antes de guardar el detalle: el monto ya trae los impuestos.
  const legacyForeign = !hadStoredTax && (expense.tags ?? []).includes(FOREIGN_EXPENSE_TAG)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [optionsError, setOptionsError] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Reset the draft every time the dialog opens so a cancelled edit never leaks into the next one.
  useEffect(() => {
    if (!open) return
    setFormData(fromExpense(expense))
    setForeignTax(foreignTaxFromStored(expense.impuesto_exterior))
    setErrors({})
    setSubmitError(null)
    setOptionsError(false)
    Promise.all([fetchCategories(), fetchPaymentMethods()])
      .then(([cats, methods]) => { setCategories(cats); setPaymentMethods(methods) })
      .catch(() => setOptionsError(true))
  }, [open, expense])

  const change = (key: keyof typeof formData, value: string) => {
    setFormData(previous => ({ ...previous, [key]: value }))
    setErrors(previous => previous[key] ? { ...previous, [key]: "" } : previous)
  }
  const fieldError = (key: string) => errors[key] ? <p id={`edit-${key}-error`} className="text-destructive text-sm">{errors[key]}</p> : null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    const newErrors: Record<string, string> = {}
    let tags: string[] = []
    try { tags = parseExpenseTags(formData.tags) } catch (error) { newErrors.tags = (error as Error).message }
    const amount = Number(formData.amount)
    if (!formData.amount || !Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) newErrors.amount = "Ingresa un monto mayor a 0, con hasta 2 decimales"
    if (!formData.description.trim()) newErrors.description = "La descripción es obligatoria"
    if (!formData.date) newErrors.date = "La fecha es obligatoria"
    if (!formData.categoryId) newErrors.categoryId = "Selecciona una categoría"
    if (!formData.paymentMethodId) newErrors.paymentMethodId = "Selecciona un método de pago"
    const foreignError = validateForeignTax(foreignTax)
    if (foreignError) newErrors.foreignTax = foreignError
    setErrors(newErrors)
    setSubmitError(null)
    const first = Object.keys(newErrors)[0]
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#${first === "tags" ? "expense-tags" : first === "foreignTax" ? "edit-foreign-enabled" : `edit-${first}`}`)?.focus()
      return
    }
    setSaving(true)
    try {
      await updateExpense(expense.id, { descripcion: formData.description.trim(), monto: computeForeignTax(amount, foreignTax).total, fecha: formData.date, categoria_id: Number(formData.categoryId), metodo_pago_id: Number(formData.paymentMethodId), tags: foreignTax.enabled ? withForeignTag(tags, foreignTax) : hadStoredTax ? tags.filter(tag => tag !== FOREIGN_EXPENSE_TAG) : tags, impuesto_exterior: storedForeignTax(amount, foreignTax, hadStoredTax) })
    } catch (error) {
      console.error("Error al actualizar gasto:", error)
      setSubmitError("No se pudieron guardar los cambios. Tus datos siguen aquí; vuelve a intentar.")
      setSaving(false)
      return
    }
    setSaving(false)
    onOpenChange(false)
    toast.success("Gasto actualizado")
    await onSaved()
  }

  const optionsReady = categories.length > 0 && paymentMethods.length > 0

  return (
    <Dialog open={open} onOpenChange={next => { if (!saving) onOpenChange(next) }}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar gasto</DialogTitle>
          <DialogDescription>Los cambios solo afectan a este gasto.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={saving} className="space-y-4">
          {optionsError && <p role="alert" className="text-sm text-destructive">No se pudieron cargar las categorías y métodos de pago. Cierra y vuelve a intentar.</p>}
          {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
          <fieldset disabled={saving} className="space-y-4 min-w-0">
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Input controlSize="form" id="edit-description" value={formData.description} onChange={e => change("description", e.target.value)} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "edit-description-error" : undefined} />
              {fieldError("description")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="edit-amount">{foreignTax.enabled ? "Precio sin impuestos" : "Monto (USD)"}</Label>
                <div className="relative"><span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input controlSize="form" id="edit-amount" type="number" inputMode="decimal" min="0.01" step="0.01" value={formData.amount} onChange={e => change("amount", e.target.value)} aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? "edit-amount-error" : undefined} className="pl-7 tabular-nums" />
                </div>
                {fieldError("amount")}
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="edit-date">Fecha</Label>
                <Input controlSize="form" id="edit-date" type="date" value={formData.date} onChange={e => change("date", e.target.value)} aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? "edit-date-error" : undefined} className="min-w-0 dark:[color-scheme:dark]" />
                {fieldError("date")}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="edit-categoryId">Categoría</Label>
                <Select value={formData.categoryId} disabled={!optionsReady} onValueChange={value => change("categoryId", value)}>
                  <SelectTrigger controlSize="form" id="edit-categoryId" aria-invalid={Boolean(errors.categoryId)}><SelectValue placeholder={optionsReady ? "Selecciona" : "Cargando…"} /></SelectTrigger>
                  <SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.nombre}</SelectItem>)}</SelectContent>
                </Select>
                {fieldError("categoryId")}
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="edit-paymentMethodId">Método de pago</Label>
                <Select value={formData.paymentMethodId} disabled={!optionsReady} onValueChange={value => change("paymentMethodId", value)}>
                  <SelectTrigger controlSize="form" id="edit-paymentMethodId" aria-invalid={Boolean(errors.paymentMethodId)}><SelectValue placeholder={optionsReady ? "Selecciona" : "Cargando…"} /></SelectTrigger>
                  <SelectContent>{paymentMethods.map(method => <SelectItem key={method.id} value={String(method.id)}>{method.nombre}</SelectItem>)}</SelectContent>
                </Select>
                {fieldError("paymentMethodId")}
              </div>
            </div>
            <ForeignTaxField idPrefix="edit-foreign" notice={legacyForeign && !foreignTax.enabled ? "Este gasto ya incluye impuestos del exterior en su monto. Si lo activas, cambia el monto al precio original para no cobrarlos dos veces." : undefined} base={Number(formData.amount)} value={foreignTax} onChange={value => { setForeignTax(value); setErrors(previous => ({ ...previous, foreignTax: "" })) }} error={errors.foreignTax} />
            <ExpenseTagsField value={formData.tags} onChange={value => change("tags", value)} error={errors.tags} />
            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button size="form" type="button" variant="outline" className="sm:flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button size="form" type="submit" disabled={!optionsReady || saving} className="sm:flex-1">{saving ? <><LoaderCircle aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />Guardando…</> : "Guardar cambios"}</Button>
            </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  )
}
