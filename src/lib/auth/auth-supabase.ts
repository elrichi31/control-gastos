import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'
import { createServerClient } from '../database'

type AuthSource = 'nextauth' | 'bearer'

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

  const supabase = await createServerClient()

  return {
    error: null,
    supabase,
    userId,
    authSource,
  }
}
