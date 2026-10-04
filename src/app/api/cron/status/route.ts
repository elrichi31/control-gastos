import { NextResponse } from 'next/server'
import { getAuthenticatedSupabaseClient } from '@/lib/auth'
import { isMissingMigration, yahooImportUserId } from '@/lib/email-sync'

export const dynamic = 'force-dynamic'

// Última corrida de cada cron. Los crons son globales: solo se expone cuándo corrieron y si
// terminaron bien; el conteo de correos nuevos solo para la cuenta dueña de la importación.
export async function GET(request: Request) {
  const auth = await getAuthenticatedSupabaseClient(request)
  if (auth.error) return auth.error
  const { data, error } = await auth.supabase.from('cron_run').select('job, ran_at, ok, detail')
  if (error) {
    if (isMissingMigration(error.code)) return NextResponse.json({ runs: [] })
    console.error('[cron-status] read failed', { code: error.code })
    return NextResponse.json({ error: 'No se pudo leer el estado de los crons' }, { status: 500 })
  }
  const owner = yahooImportUserId() === auth.userId
  return NextResponse.json({
    runs: (data ?? []).map(run => ({
      job: run.job,
      ran_at: run.ran_at,
      ok: run.ok,
      ...(run.job === 'sync-email' && owner && typeof run.detail?.nuevos === 'number' ? { nuevos: run.detail.nuevos } : {}),
    })),
  })
}
