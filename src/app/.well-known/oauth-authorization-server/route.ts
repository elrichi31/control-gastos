import { getMcpConfig, oauthErrorResponse, privateHeaders, SCOPES } from '@/lib/mcp/security'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const config = getMcpConfig()
    return Response.json({ issuer: config.origin, authorization_response_iss_parameter_supported: true, authorization_endpoint: `${config.origin}/api/mcp/oauth/authorize`, token_endpoint: `${config.origin}/api/mcp/oauth/token`, revocation_endpoint: `${config.origin}/api/mcp/oauth/revoke`, response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token'], code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'], revocation_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'], scopes_supported: SCOPES }, { headers: { ...privateHeaders, 'Access-Control-Allow-Origin': '*' } })
  } catch (error) { return oauthErrorResponse(error) }
}
