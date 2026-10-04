"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNowStrict } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

type Run = { job: string; ran_at: string; ok: boolean; nuevos?: number }
const LABELS: Record<string, string> = { "sync-email": "Correo", "recurring-expenses": "Recurrentes" }

/** Última corrida de cada cron, para saber si la sincronización automática está viva. */
export function CronStatus() {
  const [runs, setRuns] = useState<Run[] | null>(null)

  useEffect(() => {
    let alive = true
    const load = () => fetch("/api/cron/status", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .then(body => { if (alive && Array.isArray(body?.runs)) setRuns(body.runs) })
      .catch(() => {})
    void load()
    // El cron de correo corre cada 30 min; refrescar cada 5 basta.
    const timer = setInterval(load, 5 * 60_000)
    return () => { alive = false; clearInterval(timer) }
  }, [])

  if (!runs?.length) return null

  return (
    <div className="px-2.5 pb-2">
      <p className="pb-1.5 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted/80">Automatizaciones</p>
      <ul className="space-y-1">
        {runs.map(run => (
          <li key={run.job} className="flex items-center gap-2 text-[12px]" title={new Date(run.ran_at).toLocaleString("es")}>
            <span className={cn("size-1.5 shrink-0 rounded-full", run.ok ? "bg-chart-2" : "bg-destructive")} />
            <span className="text-foreground">{LABELS[run.job] ?? run.job}</span>
            <span className="ml-auto truncate text-sidebar-muted">
              {run.ok ? "" : "falló · "}
              hace {formatDistanceToNowStrict(new Date(run.ran_at), { locale: es })}
              {run.nuevos ? ` · ${run.nuevos} nuevos` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
