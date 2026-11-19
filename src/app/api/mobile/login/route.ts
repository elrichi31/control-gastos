import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createMobileSessionToken } from '@/lib/auth/mobile-session'
import { registerAuthSession } from '@/lib/auth/session-registry'
import { clientIp, LOGIN_LIMIT, rateLimited } from '@/lib/auth/rate-limit'

function createMobileAuthClient() {
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

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request.headers)
    if (rateLimited(`login:ip:${ip}`, LOGIN_LIMIT.limit * 3, LOGIN_LIMIT.windowMs)) {
      return NextResponse.json({ error: 'Demasiados intentos. Inténtalo más tarde.' }, { status: 429, headers: { 'Retry-After': '900' } })
    }
    const { email, password } = await request.json()

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password || email.length > 254 || password.length > 128) {
      return NextResponse.json(
        { error: 'Email y password son obligatorios' },
        { status: 400 }
      )
    }

    if (rateLimited(`login:acct:${email.trim().toLowerCase()}`, LOGIN_LIMIT.limit, LOGIN_LIMIT.windowMs)) {
      return NextResponse.json({ error: 'Demasiados intentos. Inténtalo más tarde.' }, { status: 429, headers: { 'Retry-After': '900' } })
    }
    const supabase = createMobileAuthClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.session || !data.user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const userName =
      data.user.user_metadata?.full_name ||
      [data.user.user_metadata?.first_name, data.user.user_metadata?.last_name]
        .filter(Boolean)
        .join(' ') ||
      data.user.email?.split('@')[0] ||
      'Usuario'
    const startedAt = Math.floor(Date.now() / 1000)
    const sessionId = await registerAuthSession(data.user.id, startedAt)
    const mobileSession = createMobileSessionToken({
      id: data.user.id,
      email: data.user.email,
      name: userName,
    }, { id: sessionId, startedAt })

    return NextResponse.json({
      access_token: mobileSession.token,
      expires_in: mobileSession.expiresIn,
      expires_at: mobileSession.expiresAt,
      token_type: 'bearer',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: userName,
      },
    })
  } catch (error) {
    console.error('Error in mobile login API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
