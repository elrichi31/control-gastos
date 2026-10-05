import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'
import { createServiceClient } from '../database/service'
import { verifyMobileSessionToken } from './mobile-session'
import { authSessionActive, sessionRegistryEnabled } from './session-registry'

type AuthSource = 'nextauth' | 'bearer' | 'mobile_session'

function createTokenAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

async function getUserIdFromBearerToken(request?: Request) {
  const authorizationHeader = request?.headers.get('authorization')

  if (!authorizationHeader) {
    return {
      error: null,
      userId: null,
      authSource: null as AuthSource | null,
    }
  }

  const [scheme, token] = authorizationHeader.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return {
      error: NextResponse.json({ error: 'Token Bearer inválido' }, { status: 401 }),
      userId: null,
      authSource: null as AuthSource | null,
    }
  }

  const mobileSession = verifyMobileSessionToken(token)

  if (mobileSession.valid) {
    if (!await authSessionActive(mobileSession.payload.sub, mobileSession.payload.sessionId, mobileSession.payload.sessionStartedAt)) {
      return { error: NextResponse.json({ error: 'Sesión revocada o expirada' }, { status: 401 }), userId: null, authSource: null }
    }
    return {
      error: null,
      userId: mobileSession.payload.sub,
      authSource: 'mobile_session' as AuthSource,
    }
  }

  if (mobileSession.reason === 'expired') {
    return {
      error: NextResponse.json({ error: 'Sesión mobile expirada' }, { status: 401 }),
      userId: null,
      authSource: null as AuthSource | null,
    }
  }

  // Once registry enforcement is active, legacy provider tokens cannot bypass app revocation.
  if (sessionRegistryEnabled()) {
    return { error: NextResponse.json({ error: 'Inicia sesión nuevamente en la app' }, { status: 401 }), userId: null, authSource: null }
  }
  const supabase = createTokenAuthClient()
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return {
      error: NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 }),
      userId: null,
      authSource: null as AuthSource | null,
    }
  }

  return {
    error: null,
    userId: data.user.id,
    authSource: 'bearer' as AuthSource,
  }
}

export async function getAuthenticatedSupabaseClient(request?: Request) {
  const bearerAuth = await getUserIdFromBearerToken(request)

  if (bearerAuth.error) {
    return {
      error: bearerAuth.error,
      supabase: null,
      userId: null,
      authSource: null,
    }
  }

  let userId = bearerAuth.userId
  let authSource = bearerAuth.authSource

  if (!userId) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }),
        supabase: null,
        userId: null,
        authSource: null,
      }
    }

    userId = session.user.id
    authSource = 'nextauth'
  }

  // Cookie-authenticated mutations must come from the canonical public origin, not
  // the request URL/Host (which may be an internal reverse-proxy address).
  if (request && !['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) {
    if (authSource === 'nextauth') {
      let origin: string;
      try {
        const url = new URL(process.env.NEXTAUTH_URL || '')
        if (url.username || url.password || !['https:', 'http:'].includes(url.protocol)
          || (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')) throw new Error()
        origin = url.origin
      } catch {
        return { error: NextResponse.json({ error: 'Configuración de seguridad pendiente' }, { status: 503 }), supabase: null, userId: null, authSource: null }
      }
      if (request.headers.get('origin') !== origin) {
        return { error: NextResponse.json({ error: 'Origen no autorizado' }, { status: 403 }), supabase: null, userId: null, authSource: null }
      }
    }
    // Verified Bearer clients do not need Origin, but cannot send simple form/text bodies.
    if (request.body !== null && (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase() !== 'application/json') {
      return { error: NextResponse.json({ error: 'Se requiere JSON' }, { status: 415 }), supabase: null, userId: null, authSource: null }
    }
  }

  // Data tables are closed to anon/authenticated (RLS, no policies): only the server's
  // service role reaches them, so every route must keep filtering by this userId.
  const supabase = createServiceClient()
  if (!supabase) {
    return {
      error: NextResponse.json({ error: 'Falta configurar el acceso privado a Supabase' }, { status: 503 }),
      supabase: null,
      userId: null,
      authSource: null,
    }
  }

  return {
    error: null,
    supabase,
    userId,
    authSource,
  }
}
