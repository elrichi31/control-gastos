import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { createServerClient } from '../database'
import { NextResponse } from 'next/server'

export async function getAuthenticatedSupabaseClient() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }),
      supabase: null,
      userId: null
    }
  }

  const supabase = await createServerClient()
  
  return {
    error: null,
    supabase,
    userId: session.user.id
  }
}