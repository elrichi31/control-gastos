"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownLeft, Check, Copy, Mail, RefreshCw, X } from 'lucide-react'
import { PageShell, PageHeader } from '@/components/ui/page-layout'
import { PageTitle } from '@/components/PageTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Gasto = { id: number; descripcion: string; monto: number; fecha: string; categoria?: { nombre: string } | null }
type Coincidencia = { gasto: Gasto; kind: 'igual' | 'mitad' | 'otro'; dias: number; veredicto?: 'encaja' | 'desconocido' | 'no_encaja'; probabilidad?: number }
const VEREDICTO = { encaja: 'el comercio encaja con tu descripción', desconocido: 'el correo no dice qué se compró', no_encaja: '' }
type Pendiente = {
  id: number; tipo: 'gasto' | 'ingreso'; origen: string; fecha: string; descripcion: string; monto: number
  categoria_id: number | null; coincidencias: Coincidencia[]
}
type Categoria = { id: number; nombre: string }
const API = '/api/email-import/yahoo'
const money = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })
const selectClass = 'h-8 rounded-md border bg-background px-2 text-xs'
const half = (n: number) => Math.round(n * 50) / 100

export default function EmailExpensesPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [pendientes, setPendientes] = useState<Pendiente[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [categoriaPor, setCategoriaPor] = useState<Record<number, number>>({})
  const [mitadPor, setMitadPor] = useState<Record<number, boolean>>({})
  const [elegidoPor, setElegidoPor] = useState<Record<number, number>>({})
  const [noEsDuplicado, setNoEsDuplicado] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    const response = await fetch(API, { cache: 'no-store' })
    const body = await response.json().catch(() => null)
    if (!response.ok) { setEnabled(true); setMessage(body?.error || 'No se pudieron cargar los movimientos.'); return }
    setEnabled(body?.enabled === true)
    setPendientes(Array.isArray(body?.pendientes) ? body.pendientes : [])
    setSelected(new Set())
  }, [])
  useEffect(() => {
    load().catch(() => setEnabled(false))
    fetch('/api/categorias').then(r => r.ok ? r.json() : []).then(data => setCategorias(Array.isArray(data) ? data : [])).catch(() => {})
  }, [load])

  const { duplicados, ingresos, nuevos } = useMemo(() => ({
    duplicados: pendientes.filter(p => p.tipo === 'gasto' && p.coincidencias.length && !noEsDuplicado.has(p.id)),
    ingresos: pendientes.filter(p => p.tipo === 'ingreso'),
    nuevos: pendientes.filter(p => p.tipo === 'gasto' && (!p.coincidencias.length || noEsDuplicado.has(p.id))),
  }), [pendientes, noEsDuplicado])

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
  const patch = (payload: object, describe: (body: Record<string, number>) => string) =>
    run(() => fetch(API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }), describe)
  const sync = () => run(() => fetch(API, { method: 'POST' }),
    body => body.nuevos === 0 ? 'No hay movimientos nuevos.' : `${body.nuevos} movimientos nuevos para revisar.`)
  const vincular = (id: number, gasto_id: number, texto: string) => patch({ vincular: [{ id, gasto_id }] }, () => texto)
  const descartar = (list: number[]) => patch({ descartar: list }, body => `${body.descartados} descartados.`)
  const crear = () => {
    const chosen = nuevos.filter(p => selected.has(p.id))
    patch({ aceptar: chosen.map(p => ({ id: p.id, categoria_id: categoriaPor[p.id] ?? p.categoria_id, ...(mitadPor[p.id] ? { monto: half(p.monto) } : {}) })) },
      body => `${body.aceptados} gastos creados con el tag "auto".`)
  }

  const toggle = (id: number) => setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  const allSelected = nuevos.length > 0 && nuevos.every(p => selected.has(p.id))
  const total = nuevos.filter(p => selected.has(p.id)).reduce((sum, p) => sum + (mitadPor[p.id] ? half(p.monto) : p.monto), 0)

  if (enabled === false) {
    return (
      <PageShell>
        <PageTitle customTitle="Gastos del correo - BethaSpend" />
        <PageHeader title="Gastos del correo" description="Movimientos detectados en tu correo." />
        <p className="max-w-2xl text-sm text-muted-foreground">La importación desde Yahoo no está habilitada para esta cuenta.</p>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageTitle customTitle="Gastos del correo - BethaSpend" />
      <PageHeader title="Gastos del correo" description="Nada cuenta como gasto hasta que lo apruebes."
        actions={<Button variant="outline" size="sm" disabled={busy} onClick={sync}><RefreshCw className={`mr-2 h-4 w-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />Sincronizar</Button>} />
      <div className="max-w-3xl space-y-6">
        {message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}
        {enabled === null && <div className="h-48 animate-pulse rounded-xl border bg-card" role="status" aria-label="Cargando movimientos" />}
        {enabled && !pendientes.length && (
          <Card><CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground"><Mail className="h-5 w-5" aria-hidden="true" />Todo revisado. Sincroniza para buscar movimientos nuevos.</CardContent></Card>
        )}

        {duplicados.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Copy className="h-4 w-4" aria-hidden="true" />Posibles duplicados <span className="font-normal text-muted-foreground">({duplicados.length})</span></CardTitle>
              <p className="text-xs text-muted-foreground">Ya registraste algo parecido a mano. Si es lo mismo, se queda tu gasto y el del correo no se crea.</p></CardHeader>
            <CardContent className="space-y-3">
              {duplicados.map(p => {
                const elegido = p.coincidencias.find(c => c.gasto.id === elegidoPor[p.id]) ?? p.coincidencias[0]
                return (
                  <div key={p.id} className="rounded-lg border p-3">
                    <Row title={p.descripcion} meta={`${p.fecha} · ${p.origen}`} amount={p.monto} />
                    <div className="mt-2 rounded-md bg-muted/40 p-2">
                      <p className="mb-1 text-xs text-muted-foreground">¿Es este gasto que ya tienes?</p>
                      {p.coincidencias.length > 1 ? (
                        <select className={`${selectClass} w-full`} aria-label={`Gasto existente para ${p.descripcion}`} value={elegido.gasto.id}
                          onChange={e => setElegidoPor(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}>
                          {p.coincidencias.map(c => <option key={c.gasto.id} value={c.gasto.id}>{c.gasto.descripcion} · {c.gasto.fecha} · {money.format(c.gasto.monto)}</option>)}
                        </select>
                      ) : <Row title={elegido.gasto.descripcion} meta={`${elegido.gasto.fecha}${elegido.gasto.categoria ? ` · ${elegido.gasto.categoria.nombre}` : ''}`} amount={elegido.gasto.monto} />}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {elegido.kind === 'mitad' ? 'Registraste la mitad (¿gasto compartido?)' : 'Mismo monto'}
                        {elegido.dias ? `, ${elegido.dias} ${elegido.dias === 1 ? 'día' : 'días'} de diferencia` : ', mismo día'}
                        {elegido.veredicto && VEREDICTO[elegido.veredicto] && ` · Jev: ${VEREDICTO[elegido.veredicto]}`}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" disabled={busy} onClick={() => vincular(p.id, elegido.gasto.id, 'Listo: se queda tu gasto, sin duplicar.')}><Check className="mr-1 h-4 w-4" aria-hidden="true" />Sí, es el mismo</Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => setNoEsDuplicado(prev => new Set(prev).add(p.id))}>No, es otro gasto</Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {ingresos.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ArrowDownLeft className="h-4 w-4" aria-hidden="true" />Te transfirieron <span className="font-normal text-muted-foreground">({ingresos.length})</span></CardTitle>
              <p className="text-xs text-muted-foreground">Si te devolvieron su parte de un gasto compartido, descuéntalo de ese gasto.</p></CardHeader>
            <CardContent className="space-y-3">
              {ingresos.map(p => {
                const elegido = p.coincidencias.find(c => c.gasto.id === elegidoPor[p.id]) ?? p.coincidencias[0]
                return (
                  <div key={p.id} className="rounded-lg border p-3">
                    <Row title={p.descripcion} meta={`${p.fecha} · ${p.origen}`} amount={p.monto} positive />
                    {elegido ? (
                      <div className="mt-2 space-y-1">
                        <label className="text-xs text-muted-foreground" htmlFor={`refund-${p.id}`}>Descontar de</label>
                        <select id={`refund-${p.id}`} className={`${selectClass} w-full`} value={elegido.gasto.id}
                          onChange={e => setElegidoPor(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}>
                          {p.coincidencias.map(c => <option key={c.gasto.id} value={c.gasto.id}>{c.gasto.descripcion} · {c.gasto.fecha} · {money.format(c.gasto.monto)}{c.kind === 'mitad' ? ' · justo el doble' : ''}</option>)}
                        </select>
                        <p className="text-xs text-muted-foreground">Quedará en {money.format(elegido.gasto.monto - p.monto)} con el tag &quot;compartido&quot;.</p>
                      </div>
                    ) : <p className="mt-2 text-xs text-muted-foreground">No hay un gasto de los últimos 20 días que lo cubra.</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {elegido && <Button size="sm" disabled={busy} onClick={() => vincular(p.id, elegido.gasto.id, `Descontado de "${elegido.gasto.descripcion}".`)}><Check className="mr-1 h-4 w-4" aria-hidden="true" />Descontar</Button>}
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => descartar([p.id])}>No es de un gasto</Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {nuevos.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4" aria-hidden="true" />Nuevos <span className="font-normal text-muted-foreground">({nuevos.length})</span></CardTitle>
              <p className="text-xs text-muted-foreground">Marca los que sí son gastos. &quot;Mitad&quot; registra solo tu parte de un gasto compartido.</p></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="mr-auto flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(nuevos.map(p => p.id)))} />
                  {selected.size ? `${selected.size} de ${nuevos.length} · ${money.format(total)}` : 'Seleccionar todos'}
                </label>
                <Button size="sm" disabled={busy || !selected.size} onClick={crear}><Check className="mr-1 h-4 w-4" aria-hidden="true" />Crear gastos</Button>
                <Button size="sm" variant="outline" disabled={busy || !selected.size} onClick={() => descartar([...selected])}><X className="mr-1 h-4 w-4" aria-hidden="true" />Descartar</Button>
              </div>
              <ul className="divide-y rounded-lg border">
                {nuevos.map(p => (
                  <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
                    <input type="checkbox" className="h-4 w-4" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Seleccionar ${p.descripcion}`} />
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="truncate text-sm font-medium">{p.descripcion}</p>
                      <p className="text-xs text-muted-foreground">{p.fecha} · {p.origen}</p>
                    </div>
                    <select className={`${selectClass} max-w-[10rem]`} aria-label={`Categoría de ${p.descripcion}`}
                      value={categoriaPor[p.id] ?? p.categoria_id ?? ''} onChange={e => setCategoriaPor(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                    <select className={selectClass} aria-label={`Parte de ${p.descripcion}`} value={mitadPor[p.id] ? 'mitad' : 'todo'}
                      onChange={e => setMitadPor(prev => ({ ...prev, [p.id]: e.target.value === 'mitad' }))}>
                      <option value="todo">Todo</option>
                      <option value="mitad">Mitad</option>
                    </select>
                    <span className="w-24 text-right text-sm tabular-nums">
                      {mitadPor[p.id] ? <>{money.format(half(p.monto))}<span className="block text-xs text-muted-foreground">de {money.format(p.monto)}</span></> : money.format(p.monto)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  )
}

function Row({ title, meta, amount, positive }: { title: string; meta: string; amount: number; positive?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      <span className={`shrink-0 text-sm tabular-nums ${positive ? 'text-chart-2' : ''}`}>{positive ? '+' : ''}{money.format(amount)}</span>
    </div>
  )
}
