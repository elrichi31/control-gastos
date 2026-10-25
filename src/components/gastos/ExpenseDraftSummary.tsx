"use client"

import { CalendarDays, CreditCard, LayoutGrid, Tag } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney } from "@/lib/utils"

export type ExpenseDraft = { total: number; categoryId: number | null; categoryName?: string; paymentName?: string; date: string; tags: string[] }

const longDate = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number)
  return year ? new Date(year, month - 1, day).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" }).replace(/\./g, "") : "—"
}

/** Vista previa en vivo de lo que se va a guardar, más cuánto lleva la categoría en el mes. */
export function ExpenseDraftSummary({ draft, expenses }: { draft: ExpenseDraft | null; expenses: readonly { categoria_id: number; monto: number; fecha: string }[] }) {
  const total = draft?.total || 0
  const month = draft?.date.slice(0, 7)
  const monthTotal = draft?.categoryId ? expenses.filter(item => item.categoria_id === draft.categoryId && item.fecha.slice(0, 7) === month).reduce((sum, item) => sum + item.monto, 0) + total : 0
  const row = (Icon: typeof Tag, label: string, value: React.ReactNode) => (
    <div className="flex items-start justify-between gap-3 text-sm">
      <dt className="flex shrink-0 items-center gap-2 text-muted-foreground"><Icon aria-hidden="true" className="size-3.5" />{label}</dt>
      <dd className="min-w-0 text-right font-medium">{value}</dd>
    </div>
  )
  return (
    <Card aria-live="polite">
      <CardHeader className="px-5 pt-5 pb-2">
        <CardTitle className="text-base font-semibold">Resumen</CardTitle>
        <p className="text-sm text-muted-foreground">Así quedará el registro.</p>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5">
        <p className="text-3xl font-semibold tabular-nums">{formatMoney(total)}</p>
        <dl className="space-y-3 border-t pt-4">
          {row(LayoutGrid, "Categoría", draft?.categoryName ?? "—")}
          {row(CreditCard, "Pago", draft?.paymentName ?? "—")}
          {row(CalendarDays, "Fecha", draft ? longDate(draft.date) : "—")}
          {row(Tag, "Etiquetas", draft?.tags.length
            ? <span className="flex flex-wrap justify-end gap-1">{draft.tags.map((tag, index) => <span key={`${index}-${tag}`} className="rounded-md border bg-muted/40 px-1.5 py-px text-[11px] font-normal text-muted-foreground break-all">{tag}</span>)}</span>
            : "—")}
        </dl>
        {draft?.categoryId && total > 0 && (
          <p className="border-t pt-4 text-xs text-muted-foreground">
            Con este gasto llevas <span className="font-semibold text-foreground tabular-nums">{formatMoney(monthTotal)}</span> en {draft.categoryName} este mes.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
