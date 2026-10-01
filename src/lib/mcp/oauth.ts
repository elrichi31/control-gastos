import { createHash } from 'node:crypto'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { type McpConfig, OAuthError, CHATGPT_CLIENT_ID, equalSecret, hashSecret, privateHeaders, randomSecret, readForm, requireSameOrigin, validateAuthorization, oauthErrorResponse } from './security'
import { chatgptClient } from './cimd'

type Session = { user?: { id?: string; email?: string | null } } | null
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const cookieName = (c: McpConfig) => c.origin.startsWith('https:') ? '__Host-mcp_csrf' : 'mcp_csrf'
function cookie(config: McpConfig, token: string, clear = false) {
  return `${cookieName(config)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : 300}${config.origin.startsWith('https:') ? '; Secure' : ''}`
}
function checkCsrf(request: Request, params: URLSearchParams, config: McpConfig) {
  requireSameOrigin(request, config)
  const cookieValue = (request.headers.get('cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${cookieName(config)}=`))?.slice(cookieName(config).length + 1)
  const token = params.get('csrf') || ''
  if (!cookieValue || !/^[A-Za-z0-9_-]{43}$/.test(token) || !equalSecret(cookieValue, token)) throw new OAuthError('access_denied', 'Confirmación inválida o vencida', 403)
}
function htmlPage(config: McpConfig, content: string, csrf: string, formRedirect?: string) {
  // Keep browser form POST Origin intact; still omit referrers to other origins.
  // Chromium also checks POST redirects. Only allow the already-validated OAuth callback origin.
  const formAction = formRedirect ? `'self' ${new URL(formRedirect).origin}` : "'self'"
  return new Response(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conexión ChatGPT · BethaSpend</title><style>body{font:16px system-ui;background:#f5f5f4;color:#242424;margin:0;padding:24px}main{max-width:560px;margin:6vh auto;background:white;border:1px solid #ddd;border-radius:16px;padding:28px}h1{font-size:24px}li{margin:12px 0}button,a{font:inherit}button{padding:12px 18px;border-radius:8px;border:1px solid #ccc;background:white;cursor:pointer;margin:8px 8px 0 0}button[value=approve]{background:#242424;color:white}small{color:#555}</style><main>${content}</main></html>`, { headers: { ...privateHeaders, 'Referrer-Policy': 'same-origin', 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': `default-src 'none'; style-src 'unsafe-inline'; form-action ${formAction}; frame-ancestors 'none'; base-uri 'none'`, 'Set-Cookie': cookie(config, csrf), 'X-Frame-Options': 'DENY' } })
}
function redirect(url: string, config: McpConfig, clearCsrf = false) {
  return new Response(null, { status: 303, headers: { ...privateHeaders, Location: url, ...(clearCsrf ? { 'Set-Cookie': cookie(config, '', true) } : {}) } })
}
export function createOAuthHandlers(config: McpConfig, db: SupabaseClient, getSession: () => Promise<Session>, cimd = chatgptClient) {
  const clientIds = [...new Set([CHATGPT_CLIENT_ID, config.clientId])]
  const consumeAssertion = async (clientId: string, jtiHash: string, expiresAt: number) => (await rpc('mcp_consume_assertion', { p_client_id: clientId, p_jti_hash: jtiHash, p_expires_at: new Date(expiresAt * 1000).toISOString() })) === true
  async function owner() {
    const session = await getSession()
    // Existing Supabase-backed accounts only. Google subject IDs are not mapped to auth.users by this app.
    if (!session?.user?.id) return null
    if (!z.string().uuid().safeParse(session.user.id).success) throw new OAuthError('access_denied', 'Conecta con tu cuenta de Supabase mediante correo y contraseña', 403)
    return { id: session.user.id, email: session.user.email || 'Tu cuenta' }
  }
  async function rpc(name: string, params: Record<string, unknown>) {
    const { data, error } = await db.rpc(name, params)
    if (error) {
      const code = typeof error.code === 'string' && /^(?:[A-Z0-9]{5}|PGRST[0-9]{3})$/.test(error.code) ? error.code : 'unknown'
      console.error('MCP database operation failed', { operation: name, code })
      throw new OAuthError('server_error', 'No se pudo completar la operación. Verifica la migración y configuración MCP.', 503)
    }
    return data
  }
  const guarded = (fn: (request: Request) => Promise<Response>) => async (request: Request) => {
    try { return await fn(request) } catch (error) { return oauthErrorResponse(error) }
  }
  return {
    authorizeGet: guarded(async request => {
      const params = new URL(request.url).searchParams
      const client = await cimd.resolve(params.get('client_id') || '', config)
      const authorization = validateAuthorization(params, client)
      const user = await owner()
      if (!user) return redirect(`${config.origin}/auth/login?callbackUrl=${encodeURIComponent('/api/mcp/oauth/authorize?' + params)}`, config)
      const csrf = randomSecret()
      const hidden = [...params].map(([k,v]) => `<input type="hidden" name="${escape(k)}" value="${escape(v)}">`).join('')
      const writes = authorization.scopes.includes('expenses:write')
      return htmlPage(config, `<h1>Conectar ChatGPT con BethaSpend</h1><p>Cuenta: <strong>${escape(user.email)}</strong></p><p>Al autorizar, ChatGPT podrá:</p><ul>${authorization.scopes.includes('expenses:read') ? '<li>Consultar tus gastos y los catálogos de categorías y métodos de pago.</li>' : ''}${writes ? '<li>Crear gastos manuales.</li><li>Editar y <strong>Eliminar</strong> tus gastos manuales, previa confirmación en ChatGPT.</li>' : ''}</ul><p>No podrá acceder a otras cuentas, ejecutar SQL ni gestionar series recurrentes. El permiso vence en 30 días y puedes revocarlo antes.</p><form method="post" action="/api/mcp/oauth/authorize">${hidden}<input type="hidden" name="csrf" value="${csrf}"><button name="decision" value="approve">Autorizar conexión</button><button name="decision" value="deny">Cancelar</button></form><p><small>No compartas tus credenciales o tokens en conversaciones. <a href="/api/mcp/connections">Administrar conexiones</a></small></p>`, csrf, authorization.redirectUri)
    }),
    authorizePost: guarded(async request => {
      const params = await readForm(request)
      checkCsrf(request, params, config)
      const client = await cimd.resolve(params.get('client_id') || '', config)
      const auth = validateAuthorization(params, client)
      const user = await owner()
      if (!user) throw new OAuthError('access_denied', 'Inicia sesión para autorizar', 401)
      const callback = new URL(auth.redirectUri)
      callback.searchParams.set('state', auth.state)
      // RFC 9207: ChatGPT checks the issuer to prevent OAuth server mix-up.
      callback.searchParams.set('iss', config.origin)
      if (params.get('decision') === 'deny') callback.searchParams.set('error', 'access_denied')
      else {
        if (params.get('decision') !== 'approve') throw new OAuthError('invalid_request', 'Falta la aprobación')
        const code = randomSecret()
        await rpc('mcp_create_authorization', { p_user_id: user.id, p_client_id: client.clientId, p_resource: config.resource, p_redirect_uri: auth.redirectUri, p_challenge: auth.challenge, p_code_hash: hashSecret(code), p_scopes: auth.scopes })
        callback.searchParams.set('code', code)
      }
      return redirect(callback.toString(), config, true)
    }),
    token: guarded(async request => {
      const params = await readForm(request)
      const client = await cimd.authenticate(request, params, config, consumeAssertion)
      if (params.get('resource') !== config.resource) throw new OAuthError('invalid_target', 'Recurso inválido')
      const access = randomSecret(), refresh = randomSecret()
      let result
      if (params.get('grant_type') === 'authorization_code') {
        const verifier = params.get('code_verifier') || ''
        const code = params.get('code') || ''
        if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) || !/^[A-Za-z0-9_-]{43}$/.test(code) || !client.redirects.includes(params.get('redirect_uri') || '')) throw new OAuthError('invalid_grant', 'Código o verificador inválido')
        const challenge = createHash('sha256').update(verifier).digest('base64url')
        result = await rpc('mcp_exchange_code', { p_code_hash: hashSecret(code), p_client_id: client.clientId, p_redirect_uri: params.get('redirect_uri'), p_resource: config.resource, p_challenge: challenge, p_access_hash: hashSecret(access), p_refresh_hash: hashSecret(refresh) })
      } else if (params.get('grant_type') === 'refresh_token') {
        const token = params.get('refresh_token') || ''
        if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new OAuthError('invalid_grant', 'Refresh token inválido')
        const scopes = params.has('scope') ? (params.get('scope') || '').split(' ').filter(Boolean) : null
        result = await rpc('mcp_refresh_tokens', { p_refresh_hash: hashSecret(token), p_client_id: client.clientId, p_resource: config.resource, p_access_hash: hashSecret(access), p_next_refresh_hash: hashSecret(refresh), p_scopes: scopes })
      } else throw new OAuthError('unsupported_grant_type', 'Flujo OAuth no soportado')
      if (!result) throw new OAuthError('invalid_grant', 'Credencial vencida, revocada o ya utilizada')
      return Response.json({ access_token: access, token_type: 'Bearer', expires_in: result.expires_in ?? 900, refresh_token: refresh, scope: result.scopes.join(' ') }, { headers: privateHeaders })
    }),
    revoke: guarded(async request => {
      const params = await readForm(request)
      const client = await cimd.authenticate(request, params, config, consumeAssertion)
      const token = params.get('token') || ''
      if (token && token.length <= 512) await rpc('mcp_revoke_token', { p_token_hash: hashSecret(token), p_client_id: client.clientId, p_resource: config.resource })
      return new Response(null, { status: 200, headers: privateHeaders })
    }),
    connectionsGet: guarded(async () => {
      const user = await owner()
      if (!user) return redirect(`${config.origin}/auth/login`, config)
      const { data, error } = await db.from('mcp_oauth_grants').select('id,created_at,expires_at,revoked_at,scopes').eq('user_id', user.id).in('client_id', clientIds).is('revoked_at', null).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(50)
      if (error) throw new OAuthError('server_error', 'No se pudieron consultar las conexiones', 503)
      const csrf = randomSecret()
      const rows = (data || []).map(g => `<li>ChatGPT · vence ${escape(g.expires_at)}<form method="post" action="/api/mcp/connections"><input type="hidden" name="grant_id" value="${escape(g.id)}"><input type="hidden" name="csrf" value="${csrf}"><button>Revocar acceso</button></form></li>`).join('')
      return htmlPage(config, `<h1>Conexiones de ChatGPT</h1><p>${escape(user.email)}</p><ul>${rows || '<li>No hay conexiones activas.</li>'}</ul><a href="/dashboard">Volver al dashboard</a>`, csrf)
    }),
    connectionsPost: guarded(async request => {
      const params = await readForm(request)
      checkCsrf(request, params, config)
      const user = await owner()
      if (!user) throw new OAuthError('access_denied', 'Inicia sesión', 401)
      const grantId = params.get('grant_id') || ''
      if (!z.string().uuid().safeParse(grantId).success) throw new OAuthError('invalid_request', 'Conexión inválida')
      const { data, error } = await db.from('mcp_oauth_grants').update({ revoked_at: new Date().toISOString() }).eq('id', grantId).eq('user_id', user.id).in('client_id', clientIds).select('id').maybeSingle()
      if (error) throw new OAuthError('server_error', 'No se pudo revocar el acceso', 503)
      if (!data) throw new OAuthError('invalid_request', 'Conexión no encontrada', 404)
      return redirect(`${config.origin}/api/mcp/connections`, config, true)
    }),
  }
}
