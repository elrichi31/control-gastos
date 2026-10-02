import { createHmac, timingSafeEqual, randomUUID } from 'crypto'
import { AUTH_SESSION_MAX_SECONDS, sessionWithinPolicy } from './session-policy'

export const MOBILE_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 3

type MobileSessionPayload = {
  sub: string
  email?: string
  name?: string
  iat: number
  exp: number
  type: 'mobile_session'
  sessionStartedAt: number
  sessionId: string
}

type VerifiedMobileSession =
  | {
      valid: true
      payload: MobileSessionPayload
    }
  | {
      valid: false
      reason: 'expired' | 'invalid'
    }

function getSigningSecret() {
  const secret = process.env.NEXTAUTH_SECRET

  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required to sign mobile sessions')
  }

  return secret
}

function encodeBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)

  return Buffer.from(`${base64}${padding}`, 'base64').toString('utf8')
}

function sign(input: string) {
  return encodeBase64Url(createHmac('sha256', getSigningSecret()).update(input).digest())
}

export function createMobileSessionToken(user: {
  id: string
  email?: string
  name?: string
}, session?: { id: string; startedAt: number }) {
  const now = Math.floor(Date.now() / 1000)
  const startedAt = session?.startedAt ?? now
  const sessionId = session?.id ?? randomUUID()
  const expiresAt = Math.min(now + MOBILE_SESSION_DURATION_SECONDS, startedAt + AUTH_SESSION_MAX_SECONDS)
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = encodeBase64Url(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      iat: now,
      exp: expiresAt,
      type: 'mobile_session',
      sessionStartedAt: startedAt,
      sessionId,
    } satisfies MobileSessionPayload)
  )
  const signature = sign(`${header}.${payload}`)

  return {
    token: `${header}.${payload}.${signature}`,
    expiresAt,
    expiresIn: Math.max(0, expiresAt - now),
  }
}

export function verifyMobileSessionToken(token: string): VerifiedMobileSession {
  const parts = token.split('.')
  if (parts.length !== 3) return { valid: false, reason: 'invalid' }
  const [header, payload, signature] = parts

  if (!header || !payload || !signature) {
    return { valid: false, reason: 'invalid' }
  }

  const expectedSignature = sign(`${header}.${payload}`)
  const signatureBuffer = Buffer.from(signature)
  const expectedSignatureBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return { valid: false, reason: 'invalid' }
  }

  try {
    const decodedHeader = JSON.parse(decodeBase64Url(header))
    const decodedPayload = JSON.parse(decodeBase64Url(payload)) as MobileSessionPayload

    if (
      decodedHeader?.alg !== 'HS256' ||
      decodedPayload?.type !== 'mobile_session' ||
      typeof decodedPayload.sub !== 'string' || !decodedPayload.sub ||
      typeof decodedPayload.sessionId !== 'string' || !decodedPayload.sessionId ||
      !Number.isSafeInteger(decodedPayload.iat) || !Number.isSafeInteger(decodedPayload.exp) ||
      !Number.isSafeInteger(decodedPayload.sessionStartedAt) ||
      decodedPayload.iat < decodedPayload.sessionStartedAt ||
      decodedPayload.exp <= decodedPayload.iat ||
      decodedPayload.exp > decodedPayload.sessionStartedAt + AUTH_SESSION_MAX_SECONDS ||
      decodedPayload.exp > decodedPayload.iat + MOBILE_SESSION_DURATION_SECONDS
    ) {
      return { valid: false, reason: 'invalid' }
    }

    if (decodedPayload.exp <= Math.floor(Date.now() / 1000) || !sessionWithinPolicy(decodedPayload.sessionStartedAt)) {
      return { valid: false, reason: 'expired' }
    }

    return {
      valid: true,
      payload: decodedPayload,
    }
  } catch {
    return { valid: false, reason: 'invalid' }
  }
}
