import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export const CHATGPT_CLIENT_ID = 'https://chatgpt.com/oauth/client.json'
export const CHATGPT_REDIRECT_URI = 'https://chatgpt.com/connector_platform_oauth_redirect'

export type McpConfig = { origin: string; resource: string; clientId: string; clientSecret: string; redirects: string[] }
export const SCOPES = ['expenses:read', 'expenses:write'] as const
export class OAuthError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message) }
}
export function getMcpConfig(): McpConfig {
  const raw = process.env.MCP_PUBLIC_ORIGIN
  const clientId = process.env.MCP_CLIENT_ID
  const clientSecret = process.env.MCP_CLIENT_SECRET
  const redirects = (process.env.MCP_REDIRECT_URIS || '').split(',').map(s => s.trim()).filter(Boolean)
  const legacyConfigured = Boolean(clientId || clientSecret || redirects.length)
  if (!raw || (legacyConfigured && (!clientId || clientId === CHATGPT_CLIENT_ID || !clientSecret || clientSecret.length < 32 || redirects.length === 0))) throw new OAuthError('server_error', 'MCP no está configurado', 503)
  let origin: URL
  try { origin = new URL(raw) } catch { throw new OAuthError('server_error', 'Origen MCP inválido', 503) }
  const local = process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(origin.hostname)
  if ((!local && origin.protocol !== 'https:') || origin.origin !== raw || origin.username || origin.password) throw new OAuthError('server_error', 'MCP requiere un origen HTTPS canónico', 503)
  for (const redirect of redirects) {
    let url: URL
    try { url = new URL(redirect) } catch { throw new OAuthError('server_error', 'Callback OAuth inválido', 503) }
    if (url.protocol !== 'https:' || url.hash || url.username || url.password) throw new OAuthError('server_error', 'Callback OAuth inseguro', 503)
  }
  return { origin: origin.origin, resource: `${origin.origin}/api/mcp`, clientId: clientId || CHATGPT_CLIENT_ID, clientSecret: clientSecret || '', redirects: redirects.length ? redirects : [CHATGPT_REDIRECT_URI] }
}
export function hashSecret(value: string) { return createHash('sha256').update(value).digest('hex') }
export function randomSecret() { return randomBytes(32).toString('base64url') }
export function equalSecret(a: string, b: string) { return timingSafeEqual(Buffer.from(hashSecret(a), 'hex'), Buffer.from(hashSecret(b), 'hex')) }
export function uniqueParameters(params: URLSearchParams) {
  const seen = new Set<string>()
  for (const key of params.keys()) {
    if (seen.has(key)) throw new OAuthError('invalid_request', 'Parámetros duplicados')
    seen.add(key)
  }
}
export function validateAuthorization(params: URLSearchParams, config: McpConfig) {
  uniqueParameters(params)
  const scopes = (params.get('scope') || 'expenses:read').split(' ').filter(Boolean)
  const redirectUri = params.get('redirect_uri') || ''
  const challenge = params.get('code_challenge') || ''
  const state = params.get('state') || ''
  if (params.get('response_type') !== 'code' || params.get('client_id') !== config.clientId || !config.redirects.includes(redirectUri) || params.get('resource') !== config.resource || params.get('code_challenge_method') !== 'S256' || !/^[A-Za-z0-9_-]{43}$/.test(challenge) || !state || state.length > 2048 || scopes.length === 0 || scopes.some(s => !SCOPES.includes(s as typeof SCOPES[number]))) throw new OAuthError('invalid_request', 'Solicitud OAuth inválida')
  return { redirectUri, challenge, state, scopes: [...new Set(scopes)] }
}
export function authenticateClient(request: Request, params: URLSearchParams, config: McpConfig) {
  uniqueParameters(params)
  let id = params.get('client_id') || '', secret = params.get('client_secret') || ''
  const header = request.headers.get('authorization')
  if (header) {
    if (!header.startsWith('Basic ') || secret) throw new OAuthError('invalid_client', 'Cliente inválido', 401)
    try {
      const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
      const split = decoded.indexOf(':')
      if (split < 0) throw new Error()
      const basicId = decodeURIComponent(decoded.slice(0, split).replace(/\+/g, ' '))
      if (id && id !== basicId) throw new Error()
      id = basicId
      secret = decodeURIComponent(decoded.slice(split + 1).replace(/\+/g, ' '))
    } catch { throw new OAuthError('invalid_client', 'Cliente inválido', 401) }
  }
  if (id !== config.clientId || !secret || !equalSecret(secret, config.clientSecret)) throw new OAuthError('invalid_client', 'Cliente inválido', 401)
}
export { safeLoginReturn } from './login-return'
export async function readForm(request: Request) {
  if (!(request.headers.get('content-type') || '').startsWith('application/x-www-form-urlencoded')) throw new OAuthError('invalid_request', 'Se requiere form-urlencoded', 415)
  const reader = request.body?.getReader()
  if (!reader) throw new OAuthError('invalid_request', 'Falta el formulario')
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > 16384) { await reader.cancel(); throw new OAuthError('invalid_request', 'Solicitud demasiado grande', 413) }
    chunks.push(value)
  }
  const params = new URLSearchParams(Buffer.concat(chunks).toString('utf8'))
  uniqueParameters(params)
  return params
}
export function requireSameOrigin(request: Request, config: McpConfig) {
  if (request.headers.get('origin') !== config.origin) throw new OAuthError('access_denied', 'Origen inválido', 403)
}
export const privateHeaders = { 'Cache-Control': 'no-store', Pragma: 'no-cache', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' }
export function oauthErrorResponse(error: unknown) {
  const known = error instanceof OAuthError
  return Response.json({ error: known ? error.code : 'server_error', error_description: known ? error.message : 'No se pudo completar la operación' }, { status: known ? error.status : 503, headers: privateHeaders })
}
