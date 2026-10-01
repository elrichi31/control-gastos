import { createLocalJWKSet, errors, jwtVerify } from 'jose'
import { z } from 'zod'
import { CHATGPT_CLIENT_ID, CHATGPT_REDIRECT_URI, type McpConfig, OAuthError, authenticateClient, hashSecret, uniqueParameters } from './security'

const JWKS_URL = 'https://chatgpt.com/oauth/jwks.json'
const ASSERTION_TYPE = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'
const CACHE_MS = 300000
const metadataSchema = z.object({
  client_id: z.literal(CHATGPT_CLIENT_ID),
  redirect_uris: z.array(z.string()).min(1).max(20),
  token_endpoint_auth_methods_supported: z.array(z.string()).max(10),
  token_endpoint_auth_signing_alg: z.literal('RS256'),
  jwks_uri: z.literal(JWKS_URL),
})
const keysSchema = z.object({ keys: z.array(z.object({
  kty: z.literal('RSA'), kid: z.string().min(1).max(128), n: z.string().min(1).max(1024), e: z.string().min(1).max(16),
  alg: z.literal('RS256').optional(), use: z.literal('sig').optional(),
}).passthrough()).min(1).max(20) })
type ConsumeAssertion = (clientId: string, jtiHash: string, expiresAt: number) => Promise<boolean>

// URLs are pinned to ChatGPT, not taken from client input or arbitrary document fields.
export function createCimdClient(fetcher: typeof fetch = fetch) {
  let metadata: Promise<z.infer<typeof metadataSchema>> | undefined
  let metadataUntil = 0
  let keys: Promise<ReturnType<typeof createLocalJWKSet>> | undefined
  let keysUntil = 0
  let keysFetchedAt = 0
  async function fetchJson(url: string, limit: number) {
    try {
      const response = await fetcher(url, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(5000) })
      if (!response.ok || response.redirected || !response.body || Number(response.headers.get('content-length')) > limit) throw new Error('Invalid metadata response')
      const reader = response.body.getReader(), chunks: Uint8Array[] = []
      let size = 0
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        size += value.length
        if (size > limit) { await reader.cancel(); throw new Error('Metadata too large') }
        chunks.push(value)
      }
      return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
    } catch { throw new OAuthError('server_error', 'No se pudo verificar la identidad OAuth de ChatGPT', 503) }
  }
  async function getMetadata() {
    if (!metadata || Date.now() >= metadataUntil) {
      metadataUntil = Date.now() + CACHE_MS
      metadata = fetchJson(CHATGPT_CLIENT_ID, 16384).then(value => {
        const parsed = metadataSchema.safeParse(value)
        if (!parsed.success || !parsed.data.redirect_uris.includes(CHATGPT_REDIRECT_URI) || !parsed.data.token_endpoint_auth_methods_supported.includes('private_key_jwt')) throw new OAuthError('server_error', 'Metadatos OAuth de ChatGPT incompatibles', 503)
        return parsed.data
      }).catch(error => { metadata = undefined; throw error })
    }
    return metadata
  }
  async function getKeys(force = false) {
    if (!keys || force || Date.now() >= keysUntil) {
      keysFetchedAt = Date.now()
      keysUntil = keysFetchedAt + CACHE_MS
      keys = fetchJson(JWKS_URL, 65536).then(value => {
        const parsed = keysSchema.safeParse(value)
        if (!parsed.success) throw new OAuthError('server_error', 'Claves públicas de ChatGPT incompatibles', 503)
        return createLocalJWKSet(parsed.data)
      }).catch(error => { keys = undefined; throw error })
    }
    return keys
  }
  async function resolve(clientId: string, config: McpConfig): Promise<McpConfig> {
    if (clientId === CHATGPT_CLIENT_ID) {
      await getMetadata()
      return { ...config, clientId: CHATGPT_CLIENT_ID, clientSecret: '', redirects: [CHATGPT_REDIRECT_URI] }
    }
    if (config.clientSecret && clientId === config.clientId) return config
    throw new OAuthError('invalid_request', 'Cliente OAuth no permitido')
  }
  async function authenticate(request: Request, params: URLSearchParams, config: McpConfig, consume: ConsumeAssertion) {
    uniqueParameters(params)
    if (params.get('client_id') !== CHATGPT_CLIENT_ID) {
      if (params.has('client_assertion') || params.has('client_assertion_type')) throw new OAuthError('invalid_client', 'Cliente inválido', 401)
      authenticateClient(request, params, config)
      return config
    }
    try {
      if (request.headers.has('authorization') || params.has('client_secret') || params.get('client_assertion_type') !== ASSERTION_TYPE) throw new Error('Mixed client credentials')
      const assertion = params.get('client_assertion') || ''
      if (!assertion || assertion.length > 12000) throw new Error('Missing assertion')
      const client = await resolve(CHATGPT_CLIENT_ID, config)
      const options = { algorithms: ['RS256'], issuer: CHATGPT_CLIENT_ID, subject: CHATGPT_CLIENT_ID, audience: [config.origin, `${config.origin}/api/mcp/oauth/token`, `${config.origin}/api/mcp/oauth/revoke`], requiredClaims: ['exp', 'jti'], clockTolerance: 5 }
      let verified
      try { verified = await jwtVerify(assertion, await getKeys(), options) }
      catch (error) {
        // Allow key rotation, but do not refetch once per attacker-controlled kid.
        if (!(error instanceof errors.JWKSNoMatchingKey) || Date.now() - keysFetchedAt < 30000) throw error
        verified = await jwtVerify(assertion, await getKeys(true), options)
      }
      const { payload, protectedHeader } = verified, now = Math.floor(Date.now() / 1000)
      if (typeof protectedHeader.kid !== 'string' || !protectedHeader.kid || protectedHeader.kid.length > 128 || typeof payload.exp !== 'number' || !Number.isInteger(payload.exp) || payload.exp <= now || payload.exp > now + 600 || typeof payload.jti !== 'string' || !payload.jti || payload.jti.length > 256 || (payload.iat !== undefined && (!Number.isInteger(payload.iat) || payload.iat > now + 5))) throw new Error('Invalid assertion claims')
      // Database-backed single use works across Vercel workers and concurrent requests.
      if (!await consume(CHATGPT_CLIENT_ID, hashSecret(payload.jti), payload.exp)) throw new Error('Assertion replay')
      return client
    } catch (error) {
      if (error instanceof OAuthError && error.status === 503) throw error
      throw new OAuthError('invalid_client', 'Cliente inválido', 401)
    }
  }
  return { resolve, authenticate }
}

// Cache public metadata/keys across requests in each worker, never assertions or tokens.
export const chatgptClient = createCimdClient()
