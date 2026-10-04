import type { SupabaseClient } from '@supabase/supabase-js'

export type CronJob = 'sync-email' | 'recurring-expenses'

/** Best-effort: si la migración falta o la escritura falla, el cron sigue respondiendo igual. */
export async function recordCronRun(db: SupabaseClient | null, job: CronJob, ok: boolean, detail: Record<string, unknown> = {}) {
  if (!db) return
  try {
    const { error } = await db.from('cron_run').upsert({ job, ran_at: new Date().toISOString(), ok, detail })
    if (error) console.error('[cron-run] record failed', { job, code: error.code })
  } catch {
    console.error('[cron-run] record failed', { job })
  }
}
