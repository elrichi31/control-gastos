"use client"

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"

export type ExpenseKind = "normal" | "recurrente"

const ExpenseDialogContext = createContext<{
  request: { kind: ExpenseKind; pathname: string } | null
  openExpense: (kind?: ExpenseKind, trigger?: HTMLElement) => void
  closeExpense: () => void
  restoreFocus: () => void
} | null>(null)

export function ExpenseDialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<{ kind: ExpenseKind; pathname: string } | null>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const openExpense = useCallback((kind: ExpenseKind = "normal", opener?: HTMLElement) => {
    trigger.current = opener ?? null
    setRequest({ kind, pathname: window.location.pathname })
  }, [])
  const closeExpense = useCallback(() => setRequest(null), [])
  const restoreFocus = useCallback(() => {
    const target = trigger.current?.isConnected ? trigger.current : document.getElementById("new-expense-trigger")
    target?.focus({ preventScroll: true })
  }, [])

  return <ExpenseDialogContext.Provider value={{ request, openExpense, closeExpense, restoreFocus }}>{children}</ExpenseDialogContext.Provider>
}

export function useExpenseDialog() {
  const context = useContext(ExpenseDialogContext)
  if (!context) throw new Error("ExpenseDialogProvider is required")
  return context
}

export function NewExpenseButton({ kind = "normal", onClick, ...props }: ButtonProps & { kind?: ExpenseKind }) {
  const { openExpense } = useExpenseDialog()
  return <Button {...props} type="button" aria-haspopup="dialog" onClick={event => {
    onClick?.(event)
    if (!event.defaultPrevented) openExpense(kind, event.currentTarget)
  }} />
}
