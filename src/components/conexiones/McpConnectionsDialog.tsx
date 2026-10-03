"use client"

import { useState } from 'react'
import { Bot, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type Connection = { id: string; created_at: string; expires_at: string; scopes: string[] | null }

const formatDate = (value: string) => new Date(value).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })

function isConnections(value: unknown): value is { connections: Connection[] } {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).connections))
}

export function McpConnectionsDialog({ onChanged }: { onChanged: () => void }) {
  const [open, setOpen] = useState(false)
  const [connections, setConnections] = useState<Connection[] | null>(null)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [changed, setChanged] = useState(false)

  async function load() {
    setConnections(null); setError(''); setConfirming(null)
    try {
      const response = await fetch('/api/mcp/connections', { cache: 'no-store', headers: { Accept: 'application/json' } })
      const body: unknown = await response.json()
      if (!response.ok || !isConnections(body)) throw new Error('Invalid connections')
      setConnections(body.connections)
    } catch { setError('No se pudieron cargar las conexiones. Intenta nuevamente.') }
  }

  async function revoke(id: string) {
    setBusy(id); setError('')
    try {
      const response = await fetch('/api/mcp/connections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_id: id }) })
      if (!response.ok) throw new Error('Revocation failed')
      setConnections(list => list?.filter(c => c.id !== id) ?? null)
      setChanged(true)
    } catch { setError('No se pudo revocar el acceso. Intenta nuevamente.') }
    finally { setBusy(null); setConfirming(null) }
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) load()
    // Refrescar el contador de la tarjeta al cerrar, no durante: refrescar desmonta la tarjeta y el modal
    else if (changed) { setChanged(false); onChanged() }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Settings2 className="mr-2 h-4 w-4" aria-hidden="true" />Administrar permisos</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conexiones de ChatGPT</DialogTitle>
          <DialogDescription>Cada autorización vence a los 30 días. Revoca las que ya no uses.</DialogDescription>
        </DialogHeader>
        {connections === null && !error ? (
          <div className="space-y-2" role="status" aria-label="Cargando conexiones">
            {[0, 1, 2].map(i => <div key={i} className="h-14 animate-pulse rounded-lg border bg-muted/30" />)}
          </div>
        ) : connections && connections.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">No hay conexiones activas.</p>
        ) : connections && (
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {connections.map(c => (
              <li key={c.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                <div className="rounded-md bg-primary/10 p-1.5 text-primary"><Bot className="h-4 w-4" aria-hidden="true" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">ChatGPT <span className="font-normal text-muted-foreground">· {c.scopes?.includes('expenses:write') ? 'Lectura y escritura' : 'Solo lectura'}</span></p>
                  <p className="text-xs text-muted-foreground">Conectado {formatDate(c.created_at)} · vence {formatDate(c.expires_at)}</p>
                </div>
                {confirming === c.id ? (
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="sm" disabled={busy === c.id} onClick={() => setConfirming(null)}>No</Button>
                    <Button variant="destructive" size="sm" disabled={busy === c.id} onClick={() => revoke(c.id)}>{busy === c.id ? 'Revocando…' : 'Revocar'}</Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="shrink-0 text-destructive hover:text-destructive" disabled={busy !== null} onClick={() => setConfirming(c.id)}>Revocar</Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
      </DialogContent>
    </Dialog>
  )
}
