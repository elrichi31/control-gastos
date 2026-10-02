import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { AUTH_SESSION_MAX_SECONDS, sessionWithinPolicy } from './session-policy'

export const sessionRegistryEnabled = () => process.env.AUTH_SESSION_REGISTRY_ENABLED === 'true'
function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || key === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('Private session registry unavailable')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
export async function googleAccountActive(userId: string, email: string | null | undefined) {
  if (!email) return false
  try {
    const { data, error } = await database().auth.admin.getUserById(userId)
    if (error || !data.user || data.user.id !== userId || data.user.email?.trim().toLowerCase() !== email.trim().toLowerCase()) return false
    const bannedUntil: unknown = (data.user as unknown as Record<string, unknown>).banned_until
    return bannedUntil == null || (typeof bannedUntil === 'string' && Number.isFinite(Date.parse(bannedUntil)) && Date.parse(bannedUntil) <= Date.now())
  } catch { return false }
}
export async function registerAuthSession(userId: string, startedAt: number) {
  const id = randomUUID()
  if (sessionRegistryEnabled()) {
    const { error } = await database().from('app_auth_sessions').insert({ id, user_id: userId, created_at: new Date(startedAt * 1000).toISOString(), expires_at: new Date((startedAt + AUTH_SESSION_MAX_SECONDS) * 1000).toISOString() })
    if (error) throw new Error('Cannot register session')
  }
  return id
}
export async function authSessionActive(userId: string, sessionId: unknown, startedAt: unknown) {
  if (!sessionWithinPolicy(startedAt)) return false
  if (!sessionRegistryEnabled()) return true
  if (typeof sessionId !== 'string' || !/^[0-9a-f-]{36}$/i.test(sessionId)) return false
  try {
    const { data, error } = await database().from('app_auth_sessions').select('id')
      .eq('id', sessionId).eq('user_id', userId).is('revoked_at', null)
      .gt('expires_at', new Date().toISOString()).maybeSingle()
    return !error && Boolean(data)
  } catch { return false }
}
export async function revokeUserSessions(userId: string) {
  if (!sessionRegistryEnabled()) throw new Error('Session registry is not active')
  const { error } = await database().from('app_auth_sessions').update({ revoked_at: new Date().toISOString() }).eq('user_id', userId).is('revoked_at', null)
  if (error) throw new Error('Cannot revoke sessions')
}
