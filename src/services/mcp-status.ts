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
