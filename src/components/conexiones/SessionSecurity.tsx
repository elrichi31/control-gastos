"use client"
import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { clearPrivateCaches } from '@/lib/pwa/cache-policy'
import { fetchSessionRevocationEnabled, revokeAllSessions } from '@/services/auth'

export function SessionSecurityCard({ enabled, busy, message, onRevoke }: { enabled: boolean | null; busy: boolean; message: string; onRevoke: () => void }) {
  return <Card><CardHeader className="pb-2"><CardTitle className="text-base">Seguridad de tu cuenta</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-xs text-muted-foreground">Cierra las sesiones web y móvil de BethaSpend. Los permisos de ChatGPT se administran por separado.</p>{enabled === false && <p className="text-xs text-muted-foreground">Revocación pendiente de activación en el servidor.</p>}<AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="sm" disabled={!enabled || busy}>{busy ? 'Cerrando sesiones…' : 'Cerrar todas mis sesiones'}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Cerrar todas tus sesiones?</AlertDialogTitle><AlertDialogDescription>También saldrás de este dispositivo. Tus datos no se eliminan; podrás volver a entrar con tu cuenta.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onRevoke}>Cerrar sesiones</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>{message && <p className="text-xs text-destructive" role="alert">{message}</p>}</CardContent></Card>
}
export function SessionSecurity() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const revocationEnabled = await fetchSessionRevocationEnabled(controller.signal)
        if (!controller.signal.aborted) setEnabled(revocationEnabled)
      } catch { if (!controller.signal.aborted) setMessage('No se pudo consultar la seguridad de la cuenta.') }
    }
    load()
    return () => controller.abort()
  }, [])
  async function revoke() {
    if (!enabled || busy) return
    setBusy(true); setMessage('')
    try {
      await revokeAllSessions()
      try { await clearPrivateCaches() } finally { await signOut({ callbackUrl: '/auth/login' }) }
    } catch { setMessage('No se pudieron cerrar las sesiones. Intenta nuevamente.') }
    finally { setBusy(false) }
  }
  return <SessionSecurityCard enabled={enabled} busy={busy} message={message} onRevoke={revoke} />
}
