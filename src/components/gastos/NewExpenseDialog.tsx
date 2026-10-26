"use client"

import { useState } from "react"
import { Receipt, Repeat2 } from "lucide-react"
import dynamic from "next/dynamic"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGastosFiltrados } from "@/hooks/useGastosFiltrados"
import { ExpenseForm } from "./ExpenseForm"
import { ExpenseDraftSummary, type ExpenseDraft } from "./ExpenseDraftSummary"
import type { ExpenseKind } from "./ExpenseDialogProvider"

const RecurringExpenseForm = dynamic(() => import("@/components/gastos-recurrentes/RecurringExpenseForm").then(module => module.RecurringExpenseForm), {
  loading: () => <p role="status">Cargando formulario…</p>,
})

export function NewExpenseDialog({ initialKind, onClose, restoreFocus }: { initialKind: ExpenseKind; onClose: () => void; restoreFocus: () => void }) {
  const [tab, setTab] = useState(initialKind)
  const [draft, setDraft] = useState<ExpenseDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const { gastos, refreshExpenses } = useGastosFiltrados()

  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose() }}>
    <DialogContent
      data-expense-entry-dialog=""
      closeButtonDisabled={busy}
      className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0"
      onPointerDownOutside={event => event.preventDefault()}
      onEscapeKeyDown={event => { if (busy) event.preventDefault() }}
      onCloseAutoFocus={event => { event.preventDefault(); restoreFocus() }}
    >
      <DialogHeader className="shrink-0 border-b px-5 py-5 pr-12 text-left sm:px-7">
        <DialogTitle>{tab === "normal" ? "Nuevo gasto" : "Nuevo gasto recurrente"}</DialogTitle>
        <DialogDescription>Registra tu gasto sin salir de esta pantalla. Los campos con * son obligatorios.</DialogDescription>
      </DialogHeader>
      <Tabs value={tab} onValueChange={value => { if (!busy) setTab(value as ExpenseKind) }} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b px-5 py-3 sm:px-7">
          <TabsList aria-label="Tipo de gasto" className="h-auto gap-1 p-1">
            <TabsTrigger disabled={busy} value="normal" className="min-h-10 gap-2 px-4"><Receipt aria-hidden="true" className="size-4" />Una vez</TabsTrigger>
            <TabsTrigger disabled={busy} value="recurrente" className="min-h-10 gap-2 px-4"><Repeat2 aria-hidden="true" className="size-4" />Recurrente</TabsTrigger>
          </TabsList>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-7">
          <TabsContent value="normal" className="mt-0">
            <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_16rem]">
              <ExpenseForm fetchExpenses={refreshExpenses} history={gastos} expenses={gastos} onDraftChange={setDraft} onSuccess={onClose} onSubmittingChange={setBusy} />
              <aside aria-label="Resumen del gasto" className="hidden min-w-0 xl:sticky xl:top-0 xl:block"><ExpenseDraftSummary draft={draft} expenses={gastos} /></aside>
            </div>
          </TabsContent>
          <TabsContent value="recurrente" className="mx-auto mt-0 max-w-2xl">
            <RecurringExpenseForm onSuccess={onClose} onSubmittingChange={setBusy} />
          </TabsContent>
        </div>
      </Tabs>
    </DialogContent>
  </Dialog>
}
