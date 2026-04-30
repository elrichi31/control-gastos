import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createMobileSessionToken } from '@/lib/auth/mobile-session'

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
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y password son obligatorios' },
        { status: 400 }
      )
    }

    const supabase = createMobileAuthClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.session || !data.user) {
      return NextResponse.json(
        { error: error?.message || 'Credenciales inválidas' },
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
    const mobileSession = createMobileSessionToken({
      id: data.user.id,
      email: data.user.email,
      name: userName,
    })

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
