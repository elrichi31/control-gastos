"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectionCard } from "./projection-card"
import type { ExpenseForecast } from "@/lib/expense-forecast"
import { fetchExpenseForecast } from "@/services/stats"

export function ProjectionPanel() {
  const [forecast, setForecast] = useState<ExpenseForecast | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setForecast(null)
    setError(null)
    setLoading(true)
    fetchExpenseForecast(format(new Date(), 'yyyy-MM-dd'), controller.signal)
      .then(data => { if (!controller.signal.aborted) setForecast(data) })
      .catch(err => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'No se pudo cargar la proyección. Reintenta.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [attempt])

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Mes actual completo; los filtros de Análisis no cambian esta estimación.</p>
      <Button variant="outline" className="h-11 shrink-0 gap-2" disabled={loading} onClick={() => setAttempt(n => n + 1)}><RefreshCw aria-hidden="true" className="h-4 w-4" />{error ? 'Reintentar proyección' : 'Actualizar proyección'}</Button>
    </div>
    {loading && <div role="status" aria-live="polite" className="space-y-4"><p className="text-sm text-muted-foreground">Cargando historial y recurrentes…</p><div aria-hidden="true" className="h-80 rounded-xl border border-border bg-card motion-safe:animate-pulse" /></div>}
    {error && <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3"><p className="text-sm text-destructive">{error}</p><p className="mt-1 text-sm text-muted-foreground">No mostramos cifras parciales mientras falta información.</p></div>}
    {!loading && !error && forecast && <ProjectionCard forecast={forecast} />}
  </div>
}
