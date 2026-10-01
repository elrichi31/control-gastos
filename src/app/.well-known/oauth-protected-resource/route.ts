import { getMcpConfig, oauthErrorResponse, privateHeaders, SCOPES } from '@/lib/mcp/security'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const config = getMcpConfig()
    return Response.json({ resource: config.resource, resource_name: 'BethaSpend', authorization_servers: [config.origin], scopes_supported: SCOPES, bearer_methods_supported: ['header'] }, { headers: { ...privateHeaders, 'Access-Control-Allow-Origin': '*' } })
  } catch (error) { return oauthErrorResponse(error) }
}
