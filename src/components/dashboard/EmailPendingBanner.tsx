"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Inbox } from "lucide-react"

/** Avisa cuántos movimientos del correo esperan revisión. Solo aparece si hay alguno. */
export function EmailPendingBanner() {
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let alive = true
    fetch("/api/email-import/yahoo?resumen=1", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .then(body => { if (alive && body?.enabled && typeof body.total === "number") setTotal(body.total) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  if (!total) return null

  return (
    <Link href="/gastos-correo"
      className="group flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 transition-colors hover:bg-primary/15">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><Inbox className="size-4" /></span>
      <span className="min-w-0 flex-1 text-[13px]">
        <span className="font-semibold text-foreground tabular-nums">{total} movimientos del correo</span>
        <span className="text-muted-foreground"> esperan tu revisión antes de registrarse.</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-primary">
        Revisar<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
