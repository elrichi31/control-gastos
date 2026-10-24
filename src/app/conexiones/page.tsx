"use client"

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { PageShell, PageHeader } from '@/components/ui/page-layout'
import { PageTitle } from '@/components/layout/PageTitle'
import { Button } from '@/components/ui/button'
import { McpStatusCard } from '@/components/conexiones/McpStatusCard'
import { SessionSecurity } from '@/components/conexiones/SessionSecurity'
import { useRemoteQuery } from '@/hooks/useRemoteData'
import { queryKeys } from '@/lib/query/client'
import { fetchMcpStatus } from '@/services/mcp-status'

export default function ConnectionsPage() {
  const query = useRemoteQuery([...queryKeys.connections, 'status'], fetchMcpStatus)
  const status = query.error ? undefined : query.data
  const loading = query.isPending
  const error = query.error ? 'No se pudo verificar MCP. Intenta nuevamente.' : ''
  const [copyMessage, setCopyMessage] = useState('')
  const refresh = () => { setCopyMessage(''); void query.refetch() }
  async function copyUrl() {
    if (!status?.endpoint) return
    try { await navigator.clipboard.writeText(status.endpoint); setCopyMessage('URL copiada') }
    catch { setCopyMessage('No se pudo copiar. Puedes seleccionar la URL manualmente.') }
  }
  return (
    <PageShell>
      <PageTitle customTitle="Conexiones - BethaSpend" />
      <PageHeader title="Conexiones" description="Estado del servidor MCP y autorizaciones de tu cuenta."
        actions={<Button variant="outline" size="sm" disabled={loading} onClick={refresh}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />Actualizar</Button>} />
      <div className="max-w-2xl space-y-4">
        {loading ? <div className="h-48 animate-pulse rounded-xl border bg-card" role="status" aria-label="Consultando estado MCP" /> : status ? <McpStatusCard status={status} onCopy={copyUrl} onChanged={refresh} /> : <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive" role="alert">{error}</div>}
        {copyMessage && <p className="mt-3 text-xs text-muted-foreground" role="status">{copyMessage}</p>}
        <SessionSecurity />
      </div>
    </PageShell>
  )
}
