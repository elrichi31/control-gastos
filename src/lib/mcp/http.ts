import type { SupabaseClient } from '@supabase/supabase-js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createExpenseServer } from './tools'
import { type McpConfig, hashSecret, OAuthError, oauthErrorResponse, privateHeaders } from './security'

export function createMcpHandler(config: McpConfig, db: SupabaseClient) {
  return async (request: Request) => {
    try {
      const origin = request.headers.get('origin')
      const allowed = [config.origin, ...config.redirects.map(uri => new URL(uri).origin)]
      // Next.js may expose an internal request URL behind a TLS reverse proxy.
      // Validate the actual Host, but derive OAuth resource URLs only from trusted configuration.
      const host = request.headers.get('host') || new URL(request.url).host
      if (host !== new URL(config.origin).host || (origin && !allowed.includes(origin))) throw new OAuthError('access_denied', 'Origen inválido', 403)
      const authorization = request.headers.get('authorization') || ''
      const match = /^Bearer ([A-Za-z0-9_-]{43})$/i.exec(authorization)
      const unauthorized = () => Response.json({ error: 'invalid_token' }, { status: 401, headers: { ...privateHeaders, 'WWW-Authenticate': `Bearer resource_metadata="${config.origin}/.well-known/oauth-protected-resource", error="invalid_token"` } })
      if (!match) return unauthorized()
      const { data, error } = await db.rpc('mcp_verify_access', { p_token_hash: hashSecret(match[1]), p_client_id: config.clientId, p_resource: config.resource })
      if (error) throw new OAuthError('server_error', 'No se pudo verificar el acceso', 503)
      if (!data) return unauthorized()
      if (data.rate_limited) return Response.json({ error: 'rate_limit_exceeded' }, { status: 429, headers: { ...privateHeaders, 'Retry-After': '60' } })
      if (typeof data.user_id !== 'string' || !Array.isArray(data.scopes)) return unauthorized()
      const server = createExpenseServer({ userId: data.user_id, scopes: data.scopes }, db)
      const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true, maxRequestBodySize: 65536 })
      try {
        await server.connect(transport)
        const response = await transport.handleRequest(request)
        for (const [key,value] of Object.entries(privateHeaders)) response.headers.set(key, value)
        return response
      } finally { await server.close() }
    } catch (error) { return oauthErrorResponse(error) }
  }
}
