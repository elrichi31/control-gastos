"use client"

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { PageShell, PageHeader } from '@/components/ui/page-layout'
import { PageTitle } from '@/components/PageTitle'
import { Button } from '@/components/ui/button'
import { McpStatusCard } from '@/components/conexiones/McpStatusCard'
import { SessionSecurity } from '@/components/conexiones/SessionSecurity'
import { isMcpStatus, type McpStatus } from '@/services/mcp-status'

export default function ConnectionsPage() {
  const [status, setStatus] = useState<McpStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setStatus(null); setError(''); setCopyMessage('')
    async function load() {
      try {
        const response = await fetch('/api/mcp/status', { cache: 'no-store', signal: controller.signal })
        const body: unknown = await response.json()
        if (!isMcpStatus(body) || (!response.ok && !(response.status === 503 && body.state === 'unavailable'))) throw new Error('Status unavailable')
        if (!controller.signal.aborted) setStatus(body)
      } catch {
        if (!controller.signal.aborted) setError('No se pudo verificar MCP. Intenta nuevamente.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [revision])
  async function copyUrl() {
    if (!status?.endpoint) return
    try { await navigator.clipboard.writeText(status.endpoint); setCopyMessage('URL copiada') }
    catch { setCopyMessage('No se pudo copiar. Puedes seleccionar la URL manualmente.') }
  }
  return (
    <PageShell>
      <PageTitle customTitle="Conexiones - BethaSpend" />
      <PageHeader title="Conexiones" description="Estado del servidor MCP y autorizaciones de tu cuenta."
        actions={<Button variant="outline" size="sm" disabled={loading} onClick={() => setRevision(value => value + 1)}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />Actualizar</Button>} />
      <div className="max-w-2xl space-y-4">
        {loading ? <div className="h-48 animate-pulse rounded-xl border bg-card" role="status" aria-label="Consultando estado MCP" /> : status ? <McpStatusCard status={status} onCopy={copyUrl} /> : <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive" role="alert">{error}</div>}
        {copyMessage && <p className="mt-3 text-xs text-muted-foreground" role="status">{copyMessage}</p>}
        <SessionSecurity />
      </div>
    </PageShell>
  )
}
