import { getMcpConfig, oauthErrorResponse, privateHeaders, SCOPES } from '@/lib/mcp/security'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const config = getMcpConfig()
    const clientMethods = config.clientSecret ? ['private_key_jwt', 'client_secret_basic', 'client_secret_post'] : ['private_key_jwt']
    return Response.json({ client_id_metadata_document_supported: true, token_endpoint_auth_signing_alg_values_supported: ['RS256'], issuer: config.origin, authorization_response_iss_parameter_supported: true, authorization_endpoint: `${config.origin}/api/mcp/oauth/authorize`, token_endpoint: `${config.origin}/api/mcp/oauth/token`, revocation_endpoint: `${config.origin}/api/mcp/oauth/revoke`, response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token'], code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: clientMethods, revocation_endpoint_auth_methods_supported: clientMethods, scopes_supported: SCOPES }, { headers: { ...privateHeaders, 'Access-Control-Allow-Origin': '*' } })
  } catch (error) { return oauthErrorResponse(error) }
}
