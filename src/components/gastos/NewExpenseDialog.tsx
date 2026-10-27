"use client"

import { useState } from "react"
import { Receipt, ReceiptText, Repeat2 } from "lucide-react"
import dynamic from "next/dynamic"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGastosFiltrados } from "@/hooks/useGastosFiltrados"
import { ExpenseForm } from "./ExpenseForm"
import type { ExpenseKind } from "./ExpenseDialogProvider"

const RecurringExpenseForm = dynamic(() => import("@/components/gastos-recurrentes/RecurringExpenseForm").then(module => module.RecurringExpenseForm), {
  loading: () => <p role="status">Cargando formulario…</p>,
})

export function NewExpenseDialog({ initialKind, onClose, restoreFocus }: { initialKind: ExpenseKind; onClose: () => void; restoreFocus: () => void }) {
  const [tab, setTab] = useState(initialKind)
  const [busy, setBusy] = useState(false)
  const { gastos, refreshExpenses } = useGastosFiltrados()

  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose() }}>
    <DialogContent
      data-expense-entry-dialog=""
      closeButtonDisabled={busy}
      className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-lg flex-col gap-0 overflow-hidden p-0"
      onPointerDownOutside={event => event.preventDefault()}
      onEscapeKeyDown={event => { if (busy) event.preventDefault() }}
      onCloseAutoFocus={event => { event.preventDefault(); restoreFocus() }}
    >
      <DialogHeader className="shrink-0 flex-row items-center gap-3 space-y-0 px-5 pb-3 pt-4 pr-14 text-left sm:px-7 sm:pt-5">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground text-background"><ReceiptText className="size-5" /></span>
        <div className="min-w-0 space-y-1">
          <DialogTitle>{tab === "normal" ? "Nuevo gasto" : "Nuevo gasto recurrente"}</DialogTitle>
          <DialogDescription className="hidden sm:block">{tab === "normal" ? "Monto, categoría y cómo lo pagaste." : "Un gasto que se repite cada período."}</DialogDescription>
        </div>
      </DialogHeader>
      <Tabs value={tab} onValueChange={value => { if (!busy) setTab(value as ExpenseKind) }} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-5 pb-3 sm:px-7">
          <TabsList aria-label="Tipo de gasto" className="h-auto w-full gap-1 p-1">
            <TabsTrigger disabled={busy} value="normal" className="min-h-9 flex-1 gap-2 px-3"><Receipt aria-hidden="true" className="size-4" />Una vez</TabsTrigger>
            <TabsTrigger disabled={busy} value="recurrente" className="min-h-9 flex-1 gap-2 px-3"><Repeat2 aria-hidden="true" className="size-4" />Recurrente</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="normal" className="mt-0 flex min-h-0 flex-1 flex-col border-t data-[state=inactive]:hidden">
          <ExpenseForm fetchExpenses={refreshExpenses} history={gastos} expenses={gastos} onSuccess={onClose} onCancel={onClose} onSubmittingChange={setBusy} />
        </TabsContent>
        <TabsContent value="recurrente" className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain border-t px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] data-[state=inactive]:hidden sm:px-7">
          <RecurringExpenseForm onSuccess={onClose} onSubmittingChange={setBusy} />
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
}
