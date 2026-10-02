export const AUTH_SESSION_MAX_SECONDS = 60 * 60 * 24 * 30

export function sessionWithinPolicy(startedAt: unknown, now = Math.floor(Date.now() / 1000)) {
  if (typeof startedAt !== 'number' || !Number.isSafeInteger(startedAt) || startedAt <= 0 || startedAt > now || now >= startedAt + AUTH_SESSION_MAX_SECONDS) return false
  const cutoff = process.env.AUTH_SESSION_NOT_BEFORE
  if (!cutoff) return true
  const timestamp = Date.parse(cutoff)
  return Number.isFinite(timestamp) && startedAt * 1000 >= timestamp
}

// Explicit server-only links to existing Supabase identities; never infer a UUID from Google subject IDs.

export function googleAdmissionConfigured() {
  try {
    const accounts: unknown = JSON.parse(process.env.AUTH_GOOGLE_ACCOUNTS || '{}')
    return Boolean(accounts && typeof accounts === 'object' && !Array.isArray(accounts) && Object.keys(accounts).some(email => allowedGoogleAccount({ email, email_verified: true })))
  } catch { return false }
}

export function allowedGoogleAccount(profile: unknown): string | null {
  if (!profile || typeof profile !== 'object') return null
  const data = profile as Record<string, unknown>
  if (data.email_verified !== true || typeof data.email !== 'string') return null
  try {
    const accounts: unknown = JSON.parse(process.env.AUTH_GOOGLE_ACCOUNTS || '{}')
    if (!accounts || typeof accounts !== 'object' || Array.isArray(accounts)) return null
    const email = data.email.trim().toLowerCase()
    const id = Object.hasOwn(accounts, email) ? (accounts as Record<string, unknown>)[email] : null
    return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : null
  } catch { return null }
}
