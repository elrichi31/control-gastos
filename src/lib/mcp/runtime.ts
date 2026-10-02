import { createClient } from '@supabase/supabase-js'
import { createOAuthHandlers } from './oauth'
import { createMcpHandler } from './http'
import { getMcpConfig, OAuthError, oauthErrorResponse } from './security'
import { createMcpStatusHandler } from './status'

export async function handleMcpStatus() {
  let db: ReturnType<typeof database> | undefined
  return createMcpStatusHandler({
    getSession: async () => {
      const { getServerSession } = await import('next-auth')
      const { authOptions } = await import('@/lib/auth/auth')
      return getServerSession(authOptions)
    },
    getConfig: () => {
      const config = getMcpConfig()
      db = database() // Validate private server settings without exposing them or querying grants.
      return config
    },
    database: () => {
      if (!db) throw new Error('MCP database unavailable')
      return db
    },
  })()
}

function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || key === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new OAuthError('server_error', 'Falta la configuración privada de Supabase para MCP', 503)
  // Never import this server module from client components. Service role stays in Vercel only.
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }) } })
}
export async function handleMcp(request: Request) {
  try { return await createMcpHandler(getMcpConfig(), database())(request) } catch (error) { return oauthErrorResponse(error) }
}
export async function handleOAuth(name: keyof ReturnType<typeof createOAuthHandlers>, request: Request) {
  try {
    const config = getMcpConfig()
    const db = database()
    // Lazy imports keep unconfigured endpoints fail-closed without initializing legacy auth clients.
    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('@/lib/auth/auth')
    return await createOAuthHandlers(config, db, () => getServerSession(authOptions))[name](request)
  } catch (error) { return oauthErrorResponse(error) }
}
