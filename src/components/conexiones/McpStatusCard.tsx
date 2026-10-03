"use client"

import { Plug, Copy } from 'lucide-react'
import { McpConnectionsDialog } from './McpConnectionsDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { McpStatus } from '@/services/mcp-status'

export function McpStatusCard({ status, onCopy, onChanged }: { status: McpStatus; onCopy: () => void; onChanged: () => void }) {
  const ready = status.state === 'ready'
  const label = ready ? 'Configurado' : status.state === 'not_configured' ? 'Sin configurar' : 'No disponible'
  return (
    <Card>
      <CardHeader className="flex-col items-start gap-3 space-y-0 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-lg bg-primary/10 p-2 text-primary"><Plug className="h-5 w-5" aria-hidden="true" /></div>
          <div><CardTitle className="text-base">BethaSpend · ChatGPT</CardTitle><p className="mt-1 text-xs text-muted-foreground">Servidor MCP</p></div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${ready ? 'bg-chart-2/10 text-chart-2' : 'bg-muted text-muted-foreground'}`}>{label}</span>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status.accountSupported ? (
          <p className="text-sm text-muted-foreground">Para conectar MCP, inicia sesión con tu cuenta de correo y contraseña.</p>
        ) : ready ? (
          <div>
            <p className="text-sm font-medium">{status.activeConnections === 0 ? 'Sin conexiones activas' : `${status.activeConnections} ${status.activeConnections === 1 ? 'conexión activa' : 'conexiones activas'}`}</p>
            <p className="mt-1 text-xs text-muted-foreground">{status.activeConnections === 0 ? 'Agrega la URL en ChatGPT y autoriza el acceso con tu cuenta.' : 'Autorizaciones vigentes de tu cuenta. Puedes revocarlas cuando quieras.'}</p>
          </div>
        ) : <p className="text-sm text-muted-foreground">{status.state === 'not_configured' ? 'Falta completar la configuración del servidor MCP.' : 'No pudimos verificar las conexiones. Vuelve a consultar el estado.'}</p>}
        {ready && status.endpoint && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <code className="min-w-0 flex-1 break-all text-xs">{status.endpoint}</code>
            <Button variant="ghost" size="icon" onClick={onCopy} aria-label="Copiar URL MCP" className="shrink-0"><Copy className="h-4 w-4" /></Button>
          </div>
        )}
        {ready && status.accountSupported && (
          <McpConnectionsDialog onChanged={onChanged} />
        )}
      </CardContent>
    </Card>
  )
}
