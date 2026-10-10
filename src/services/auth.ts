// src/services/auth.ts

export interface RegisterInput {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface RegisterResult {
  needsEmailConfirmation?: unknown
  message?: string
}

/** Crea la cuenta. El llamador valida la forma de la respuesta. */
export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Error al crear la cuenta')
  return data
}

/** Indica si el servidor ya permite revocar todas las sesiones. */
export async function fetchSessionRevocationEnabled(signal: AbortSignal): Promise<boolean> {
  const response = await fetch('/api/auth/sessions', { cache: 'no-store', signal })
  const data: unknown = await response.json()
  if (!response.ok || !data || typeof data !== 'object' || typeof (data as Record<string, unknown>).revocationEnabled !== 'boolean') throw new Error('Invalid status')
  return (data as { revocationEnabled: boolean }).revocationEnabled
}

export async function revokeAllSessions(): Promise<void> {
  const response = await fetch('/api/auth/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  const data: unknown = await response.json()
  if (!response.ok || !data || typeof data !== 'object' || (data as Record<string, unknown>).success !== true) throw new Error('Revocation failed')
}
