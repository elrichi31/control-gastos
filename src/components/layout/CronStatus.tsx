"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNowStrict } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { fetchCronRuns, type CronRun } from "@/services/cron"

const LABELS: Record<string, string> = { "sync-email": "Correo", "recurring-expenses": "Recurrentes" }

/** Última corrida de cada cron, para saber si la sincronización automática está viva. */
export function CronStatus() {
  const [runs, setRuns] = useState<CronRun[] | null>(null)

  useEffect(() => {
    let alive = true
    const load = () => fetchCronRuns()
      .then(runs => { if (alive) setRuns(runs) })
      .catch(() => {})
    void load()
    // El cron de correo corre cada 30 min; refrescar cada 5 basta.
    const timer = setInterval(load, 5 * 60_000)
    return () => { alive = false; clearInterval(timer) }
  }, [])

  if (!runs) return null

  return (
    <div className="px-2.5 pb-2">
      <p className="pb-1.5 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted/80">Automatizaciones</p>
      <ul className="space-y-1">
        {Object.entries(LABELS).map(([job, label]) => {
          const run = runs.find(r => r.job === job)
          return (
            <li key={job} className="flex items-center gap-2 text-[12px]" title={run ? new Date(run.ran_at).toLocaleString("es") : undefined}>
              <span className={cn("size-1.5 shrink-0 rounded-full", !run ? "bg-sidebar-muted/50" : run.ok ? "bg-chart-2" : "bg-destructive")} />
              <span className="text-foreground">{label}</span>
              <span className="ml-auto truncate text-sidebar-muted">
                {!run ? "sin ejecuciones aún" : <>
                  {run.ok ? "" : "falló · "}
                  hace {formatDistanceToNowStrict(new Date(run.ran_at), { locale: es })}
                  {run.nuevos ? ` · ${run.nuevos} nuevos` : ""}
                </>}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
