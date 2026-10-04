"use client"

import { useCallback, useEffect, useState } from 'react'
import { Check, Mail, RefreshCw, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Pendiente = { id: number; origen: string; fecha: string; descripcion: string; monto: number; categoria_id: number | null }
type Categoria = { id: number; nombre: string }
const money = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })

export function YahooImportCard() {
  const [enabled, setEnabled] = useState(false)
  const [pendientes, setPendientes] = useState<Pendiente[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [categoriaPor, setCategoriaPor] = useState<Record<number, number>>({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    const response = await fetch('/api/email-import/yahoo', { cache: 'no-store' })
    const body = response.ok ? await response.json() : null
    setEnabled(body?.enabled === true)
    setPendientes(Array.isArray(body?.pendientes) ? body.pendientes : [])
    setSelected(new Set())
  }, [])
  useEffect(() => {
    load().catch(() => {})
    fetch('/api/categorias').then(r => r.ok ? r.json() : []).then(data => setCategorias(Array.isArray(data) ? data : [])).catch(() => {})
  }, [load])
  if (!enabled) return null

  async function run(action: () => Promise<Response>, describe: (body: Record<string, number>) => string) {
    setBusy(true); setMessage('')
    try {
      const response = await action()
      const body = await response.json()
      if (!response.ok) throw new Error(body?.error)
      setMessage(describe(body))
      await load()
    } catch (error) {
      setMessage((error as Error).message || 'Algo falló. Intenta nuevamente.')
    } finally {
      setBusy(false)
    }
  }
  const sync = () => run(() => fetch('/api/email-import/yahoo', { method: 'POST' }),
    body => body.nuevos === 0 ? 'No hay consumos nuevos.' : `${body.nuevos} consumos nuevos para revisar.`)
  const resolve = (accept: boolean) => {
    const chosen = pendientes.filter(p => selected.has(p.id))
    const payload = accept
      ? { aceptar: chosen.map(p => ({ id: p.id, categoria_id: categoriaPor[p.id] ?? p.categoria_id })) }
      : { descartar: chosen.map(p => p.id) }
    return run(() => fetch('/api/email-import/yahoo', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
      body => accept ? `${body.aceptados} gastos creados con el tag "auto".` : `${body.descartados} consumos descartados.`)
  }
  const toggle = (id: number) => setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  const allSelected = pendientes.length > 0 && selected.size === pendientes.length
  const total = pendientes.filter(p => selected.has(p.id)).reduce((sum, p) => sum + Number(p.monto), 0)

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-lg bg-primary/10 p-2 text-primary"><Mail className="h-5 w-5" aria-hidden="true" /></div>
          <div><CardTitle className="text-base">Consumos del correo</CardTitle><p className="mt-1 text-xs text-muted-foreground">Yahoo Mail · Diners, Produbanco, Pichincha y Deuna</p></div>
        </div>
        <Button variant="outline" size="sm" disabled={busy} onClick={sync} className="shrink-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />Sincronizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}
        {pendientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes consumos pendientes de revisar.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <label className="mr-auto flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(pendientes.map(p => p.id)))} />
                {selected.size ? `${selected.size} de ${pendientes.length} · ${money.format(total)}` : `${pendientes.length} pendientes`}
              </label>
              <Button size="sm" disabled={busy || !selected.size} onClick={() => resolve(true)}><Check className="mr-1 h-4 w-4" aria-hidden="true" />Crear gastos</Button>
              <Button size="sm" variant="outline" disabled={busy || !selected.size} onClick={() => resolve(false)}><X className="mr-1 h-4 w-4" aria-hidden="true" />Descartar</Button>
            </div>
            <ul className="max-h-[28rem] divide-y overflow-y-auto rounded-lg border">
              {pendientes.map(p => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                  <input type="checkbox" className="h-4 w-4" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Seleccionar ${p.descripcion}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.descripcion}</p>
                    <p className="text-xs text-muted-foreground">{p.fecha} · {p.origen}</p>
                  </div>
                  <select
                    className="h-8 max-w-[10rem] rounded-md border bg-background px-2 text-xs"
                    aria-label={`Categoría de ${p.descripcion}`}
                    value={categoriaPor[p.id] ?? p.categoria_id ?? ''}
                    onChange={e => setCategoriaPor(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                  >
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  <span className="w-20 text-right text-sm tabular-nums">{money.format(Number(p.monto))}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
