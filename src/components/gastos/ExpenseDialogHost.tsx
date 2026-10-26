"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { useExpenseDialog } from "./ExpenseDialogProvider"

const NewExpenseDialog = dynamic(() => import("./NewExpenseDialog").then(module => module.NewExpenseDialog), {
  loading: () => <p role="status" className="fixed inset-x-4 top-20 z-50 rounded-lg border bg-background p-4 text-center shadow-lg">Abriendo formulario…</p>,
})

export function ExpenseDialogHost() {
  const { request, openExpense, closeExpense, restoreFocus } = useExpenseDialog()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Installed PWA shortcuts and old /form bookmarks open the same shared dialog.
  useEffect(() => {
    const kind = searchParams.get("gasto")
    if (kind !== "normal" && kind !== "recurrente") return
    openExpense(kind)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("gasto")
    const query = params.toString()
    window.history.replaceState(null, "", `${pathname}${query ? `?${query}` : ""}${window.location.hash}`)
  }, [pathname, searchParams, openExpense])

  useEffect(() => {
    if (request && request.pathname !== pathname) closeExpense()
  }, [request, pathname, closeExpense])

  if (!request || request.pathname !== pathname) return null
  return <NewExpenseDialog initialKind={request.kind} onClose={closeExpense} restoreFocus={restoreFocus} />
}
