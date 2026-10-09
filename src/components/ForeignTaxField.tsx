"use client"

import { Globe } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { formatMoney } from "@/lib/utils"
import { FOREIGN_EXPENSE_TAG, FOREIGN_TAXES, computeForeignTax, type ForeignTaxId, type ForeignTaxState } from "@/lib/foreign-tax"

/**
 * Interruptor "Compra en el exterior": al activarlo el usuario elige qué impuestos
 * le cobró el banco y ve en vivo cuánto sube el precio antes de guardar.
 */
export function ForeignTaxField({ idPrefix = "foreign", base, value, onChange, error }: {
  idPrefix?: string
  base: number
  value: ForeignTaxState
  onChange: (value: ForeignTaxState) => void
  error?: string
}) {
  const breakdown = computeForeignTax(base, value)
  const toggle = (id: ForeignTaxId) => onChange({ ...value, selected: value.selected.includes(id) ? value.selected.filter(item => item !== id) : [...value.selected, id] })
  const switchId = `${idPrefix}-enabled`
  const customOn = value.selected.includes("custom")

  return (
    <div className={`rounded-lg border ${value.enabled ? "border-primary/40 bg-primary/5" : "border-input"} p-3 space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={switchId} className="flex items-start gap-2.5 cursor-pointer min-w-0">
          <Globe aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0">
            <span className="block text-sm font-medium">Compra en el exterior</span>
            <span className="block text-xs text-muted-foreground">Actívalo si pagaste a una tienda o app extranjera y tu banco te cobró impuestos extra.</span>
          </span>
        </label>
        <Switch id={switchId} checked={value.enabled} onCheckedChange={enabled => onChange({ ...value, enabled })} aria-describedby={error ? `${idPrefix}-error` : undefined} />
      </div>

      {value.enabled && (
        <div className="space-y-3">
          <fieldset className="space-y-2 min-w-0">
            <legend className="text-xs font-medium text-muted-foreground mb-1.5">¿Qué te cobraron? Puedes marcar varios.</legend>
            {FOREIGN_TAXES.map(tax => {
              const checked = value.selected.includes(tax.id)
              return (
                <label key={tax.id} className={`flex items-start gap-2.5 rounded-md border px-3 py-2 cursor-pointer transition-colors ${checked ? "border-primary/40 bg-card" : "border-input bg-card/60 hover:bg-accent"}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(tax.id)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2 text-sm"><span className="font-medium">{tax.label}</span><span className="tabular-nums text-muted-foreground">{tax.rate}%</span></span>
                    <span className="block text-xs text-muted-foreground">{tax.hint}</span>
                  </span>
                </label>
              )
            })}
            <div className={`flex flex-wrap items-center gap-2.5 rounded-md border px-3 py-2 ${customOn ? "border-primary/40 bg-card" : "border-input bg-card/60"}`}>
              <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium">
                <input type="checkbox" checked={customOn} onChange={() => toggle("custom")} className="h-4 w-4 shrink-0 accent-primary" />
                Otro porcentaje
              </label>
              {customOn && (
                <div className="relative w-24">
                  <Input aria-label="Porcentaje personalizado" type="number" inputMode="decimal" min="0.01" max="100" step="0.01" placeholder="0" value={value.customRate} onChange={event => onChange({ ...value, customRate: event.target.value })} className="h-9 pr-7 text-base sm:text-sm tabular-nums" />
                  <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              )}
            </div>
          </fieldset>

          <dl aria-live="polite" className="rounded-md bg-card border border-input px-3 py-2 text-sm space-y-1 tabular-nums">
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Precio original</dt><dd>{formatMoney(breakdown.base)}</dd></div>
            {breakdown.lines.map(line => <div key={line.id} className="flex justify-between gap-2"><dt className="text-muted-foreground">+ {line.label}</dt><dd>{formatMoney(line.amount)}</dd></div>)}
            <div className="flex justify-between gap-2 border-t pt-1 font-semibold"><dt>Total que se guarda</dt><dd>{formatMoney(breakdown.total)}</dd></div>
          </dl>
          <p className="text-xs text-muted-foreground">Se le añadirá la etiqueta #{FOREIGN_EXPENSE_TAG} para que lo encuentres luego.</p>
        </div>
      )}
      {error && <p id={`${idPrefix}-error`} role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
