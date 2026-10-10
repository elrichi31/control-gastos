export interface McpStatus {
  state: 'ready' | 'not_configured' | 'unavailable'
  endpoint: string | null
  activeConnections: number | null
  accountSupported: boolean
}

export function isMcpStatus(value: unknown): value is McpStatus {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  if (!['ready', 'not_configured', 'unavailable'].includes(String(data.state)) || typeof data.accountSupported !== 'boolean') return false
  if (data.endpoint !== null && typeof data.endpoint !== 'string') return false
  if (data.activeConnections !== null && !(typeof data.activeConnections === 'number' && Number.isSafeInteger(data.activeConnections) && data.activeConnections >= 0)) return false
  if (data.state === 'ready') return typeof data.endpoint === 'string' && (data.accountSupported ? data.activeConnections !== null : data.activeConnections === null)
  return data.activeConnections === null
}

export async function fetchMcpStatus(signal: AbortSignal): Promise<McpStatus> {
  const response = await fetch('/api/mcp/status', { cache: 'no-store', signal })
  const body: unknown = await response.json()
  if (!isMcpStatus(body) || (!response.ok && !(response.status === 503 && body.state === 'unavailable'))) throw new Error('Status unavailable')
  return body
}

export type McpConnection = { id: string; created_at: string; expires_at: string; scopes: string[] | null }

function isConnections(value: unknown): value is { connections: McpConnection[] } {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).connections))
}

export async function fetchMcpConnections(): Promise<McpConnection[]> {
  const response = await fetch('/api/mcp/connections', { cache: 'no-store', headers: { Accept: 'application/json' } })
  const body: unknown = await response.json()
  if (!response.ok || !isConnections(body)) throw new Error('Invalid connections')
  return body.connections
}

export async function revokeMcpConnection(grantId: string): Promise<void> {
  const response = await fetch('/api/mcp/connections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_id: grantId }) })
  if (!response.ok) throw new Error('Revocation failed')
}
