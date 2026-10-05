import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(6).max(128),
})
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
const unavailable = () => json({ error: 'El registro no está disponible. Revisa que el registro esté habilitado en Supabase.' }, 503)

export async function POST(request: NextRequest) {
  let input: unknown
  try { input = await request.json() } catch { return json({ error: 'Solicitud inválida' }, 400) }
  const parsed = schema.safeParse(input)
  if (!parsed.success) return json({ error: 'Revisa nombre, apellido, correo y contraseña (mínimo 6 caracteres).' }, 400)

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return unavailable()
    // Never silently downgrade verified signup if the provider is misconfigured.
    const settingsResponse = await fetch(`${url.replace(/\/$/, '')}/auth/v1/settings`, {
      headers: { apikey: key }, cache: 'no-store', signal: AbortSignal.timeout(5000),
    })
    if (!settingsResponse.ok) return unavailable()
    const settings = await settingsResponse.json()
    if (settings?.disable_signup !== false || typeof settings?.mailer_autoconfirm !== 'boolean') return unavailable()
    const needsEmailConfirmation = !settings.mailer_autoconfirm
    // Production mail destinations come from server configuration, never request Host.
    const origin = new URL(process.env.NEXTAUTH_URL || (process.env.NODE_ENV !== 'production' ? request.nextUrl.origin : ''))
    if (!['https:', 'http:'].includes(origin.protocol) || (process.env.NODE_ENV === 'production' && origin.protocol !== 'https:')) return unavailable()
    const { firstName, lastName, email, password } = parsed.data
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: `${firstName} ${lastName}`, first_name: firstName, last_name: lastName },
        emailRedirectTo: `${origin.origin}/auth/login`,
      },
    })
    if (error) return json({ error: 'No se pudo crear la cuenta. Revisa tus datos o inténtalo más tarde.' }, 400)
    if (!data.user || (needsEmailConfirmation && data.session)) return unavailable()
    return json({
      message: needsEmailConfirmation
        ? 'Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.'
        : 'Cuenta creada. Ya puedes iniciar sesión.',
      needsEmailConfirmation,
      user: { id: data.user.id, email: data.user.email, name: `${firstName} ${lastName}` },
    })
  } catch { return unavailable() }
}
