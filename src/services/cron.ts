// src/services/cron.ts

export type CronRun = { job: string; ran_at: string; ok: boolean; nuevos?: number }

/** Última corrida de cada cron. */
export async function fetchCronRuns(): Promise<CronRun[]> {
  const response = await fetch('/api/cron/status', { cache: 'no-store' })
  if (!response.ok) throw new Error('Error al obtener el estado de los cron')
  const body = await response.json()
  if (!Array.isArray(body?.runs)) throw new Error('Respuesta de cron inválida')
  return body.runs
}
