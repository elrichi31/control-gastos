import { NextRequest, NextResponse } from 'next/server'
import {
  createMobileSessionToken,
  verifyMobileSessionToken,
} from '@/lib/auth/mobile-session'
import { authSessionActive } from '@/lib/auth/session-registry'

export async function POST(request: NextRequest) {
  try {
    const authorizationHeader = request.headers.get('authorization')
    const [scheme, token] = authorizationHeader?.split(' ') || []

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return NextResponse.json(
        { error: 'Token Bearer inválido' },
        { status: 401 }
      )
    }

    const session = verifyMobileSessionToken(token)

    if (!session.valid) {
      return NextResponse.json(
        {
          error:
            session.reason === 'expired'
              ? 'Sesión mobile expirada'
              : 'Token inválido',
        },
        { status: 401 }
      )
    }

    if (!await authSessionActive(session.payload.sub, session.payload.sessionId, session.payload.sessionStartedAt)) {
      return NextResponse.json({ error: 'Sesión revocada o expirada' }, { status: 401 })
    }
    const mobileSession = createMobileSessionToken({
      id: session.payload.sub,
      email: session.payload.email,
      name: session.payload.name,
    }, { id: session.payload.sessionId, startedAt: session.payload.sessionStartedAt })

    return NextResponse.json({
      access_token: mobileSession.token,
      expires_in: mobileSession.expiresIn,
      expires_at: mobileSession.expiresAt,
      token_type: 'bearer',
      user: {
        id: session.payload.sub,
        email: session.payload.email,
        name: session.payload.name,
      },
    })
  } catch (error) {
    console.error('Error in mobile refresh API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
