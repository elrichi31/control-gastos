import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { CHATGPT_CLIENT_ID, privateHeaders, type McpConfig } from './security'
import type { McpStatus } from '@/services/mcp-status'

export function createMcpStatusHandler(deps: {
  getSession: () => Promise<{ user?: { id?: string } } | null>
  getConfig: () => McpConfig
  database: () => SupabaseClient
}) {
  return async () => {
    const reply = (body: McpStatus, status = 200) => Response.json(body, { status, headers: privateHeaders })
    let endpoint: string | null = null
    let accountSupported = true
    try {
      const session = await deps.getSession()
      if (!session?.user?.id) return Response.json({ error: 'Inicia sesión' }, { status: 401, headers: privateHeaders })
      accountSupported = z.string().uuid().safeParse(session.user.id).success
      let config: McpConfig
      try { config = deps.getConfig() } catch {
        return reply({ state: 'not_configured', endpoint: null, activeConnections: null, accountSupported })
      }
      endpoint = config.resource
      if (!accountSupported) return reply({ state: 'ready', endpoint, activeConnections: null, accountSupported })
      const { count, error } = await deps.database().from('mcp_oauth_grants')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .in('client_id', [...new Set([CHATGPT_CLIENT_ID, config.clientId])])
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
      if (error || count === null || !Number.isSafeInteger(count) || count < 0) throw new Error('Status unavailable')
      return reply({ state: 'ready', endpoint, activeConnections: count, accountSupported })
    } catch {
      return reply({ state: 'unavailable', endpoint, activeConnections: null, accountSupported }, 503)
    }
  }
}
