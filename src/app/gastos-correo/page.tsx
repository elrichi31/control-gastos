"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Inbox, Loader2, RefreshCw, Search, X } from 'lucide-react'
import { toast } from "sonner"
import { PageShell, PageHeader } from '@/components/ui/page-layout'
import { PageTitle } from '@/components/PageTitle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getSessionEmailReviewQueue, type ReviewJob } from '@/lib/email-review-queue'
import { REVIEW_PAGE_SIZE as PAGE_SIZE } from '@/lib/email-review-page'
import styles from './review.module.css'

type Gasto = { id: number; descripcion: string; monto: number; fecha: string; categoria?: { nombre: string } | null }
type Coincidencia = { gasto: Gasto; kind: 'igual' | 'mitad' | 'otro'; dias: number; veredicto?: 'encaja' | 'desconocido' | 'no_encaja'; probabilidad?: number }
type Pendiente = { id: number; tipo: 'gasto' | 'ingreso'; origen: string; fecha: string; descripcion: string; descripcion_original?: string; destinatario?: string | null; alias?: string; monto: number; categoria_id: number | null; coincidencias: Coincidencia[] }
type Categoria = { id: number; nombre: string }
type Tab = 'nuevos' | 'duplicados' | 'recibidos'
type PageMeta = { counts: Record<Tab, number>; total: number; page: number; pages: number }
const tabOf = (p: Pendiente, otros: Set<number>): Tab => p.tipo === 'ingreso' ? 'recibidos' : p.coincidencias.length && !otros.has(p.id) ? 'duplicados' : 'nuevos'
const API = '/api/email-import/yahoo'
const money = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })
const selectClass = 'h-11 w-full min-w-0 rounded-lg border border-input bg-card px-2.5 text-base shadow-xs dark:[color-scheme:dark] focus-visible:outline-2 focus-visible:outline-ring sm:h-8 sm:text-[13px]'
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
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState('')
  const [jobs, setJobs] = useState<ReviewJob[]>([])
  const [loadError, setLoadError] = useState('')
  const [tab, setTab] = useState<Tab>('nuevos')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [aliasDrafts, setAliasDrafts] = useState<Record<string, string>>({})
  const [aliasSaving, setAliasSaving] = useState<string | null>(null)
  const [descriptionDrafts, setDescriptionDrafts] = useState<Record<number, string>>({})
  const mounted = useRef(true)
  const loadVersion = useRef(0)
  const queue = useRef<ReturnType<typeof getSessionEmailReviewQueue> | null>(null)
  // load() es estable (lo usa la cola); lee la página pedida de aquí.
  const params = useRef({ tab, page, query, otros: noEsDuplicado })
  params.current = { tab, page, query, otros: noEsDuplicado }

  const load = useCallback(async () => {
    const version = ++loadVersion.current
    const { tab, page, query, otros } = params.current
    const url = `${API}?${new URLSearchParams({ tab, page: String(page), ...(query ? { q: query } : {}), ...(otros.size ? { otros: [...otros].join(',') } : {}) })}`
    setLoading(true)
    try {
      const response = await fetch(url, { cache: 'no-store' })
      const body = await response.json().catch(() => null)
      if (!response.ok || !body || !Array.isArray(body.pendientes)) throw new Error(body?.error || 'No se pudieron cargar los movimientos.')
      if (!mounted.current || version !== loadVersion.current) return
      setEnabled(body.enabled === true)
      setPendientes(body.pendientes)
      setMeta(body.counts ? { counts: body.counts, total: body.total, page: body.page, pages: body.pages } : null)
      if (body.page && body.page !== page) setPage(body.page)
      const available = new Set<number>(body.pendientes.map((p: Pendiente) => p.id))
      setSelected(prev => new Set([...prev].filter(id => available.has(id))))
      setLoadError('')
    } catch (cause) {
      if (mounted.current && version === loadVersion.current) setLoadError((cause as Error).message || 'No se pudo conectar. Intenta de nuevo.')
    } finally {
      if (mounted.current && version === loadVersion.current) setLoading(false)
    }
  }, [])

  if (!queue.current) queue.current = getSessionEmailReviewQueue(job => {
      const id = `correo-${job.id}`
      if (job.status === 'queued' || job.status === 'saving') toast.loading(`${job.status === 'queued' ? 'En cola' : 'Guardando'} · ${job.label}`, { id })
      else if (job.status === 'success') toast.success(job.label, { id, duration: 3500 })
      else toast.error(`${job.label}: ${job.error}`, { id, duration: 7000 })
  })
  useEffect(() => {
    mounted.current = true
    return queue.current!.subscribe({
      onChange: next => { if (mounted.current) { ++loadVersion.current; setJobs(next) } },
      // One reconciliation per drained batch, not a slow full read after every click.
      onIdle: () => { if (mounted.current) void load() },
    })
  }, [load])

  useEffect(() => {
    mounted.current = true
    fetch('/api/categorias').then(r => { if (!r.ok) throw new Error(); return r.json() }).then(data => {
      if (mounted.current) setCategorias(Array.isArray(data) ? data : [])
    }).catch(() => { if (mounted.current) setMessage('No se cargaron las categorías. Recarga antes de aceptar gastos.') })
    return () => { mounted.current = false }
  }, [load])
  // Cada cambio de pestaña, página, búsqueda o "es otro gasto" pide esa página al servidor.
  useEffect(() => { void load() }, [tab, page, query, noEsDuplicado, load])
  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setPage(1) }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const inFlight = jobs.filter(job => job.status === 'queued' || job.status === 'saving').length
  const hidden = useMemo(() => new Set(jobs.filter(job => job.status !== 'error').map(job => job.id)), [jobs])
  const errors = new Map(jobs.filter(job => job.status === 'error').map(job => [job.id, job.error]))
  const { duplicados, recibidos, nuevos } = useMemo(() => {
    const visible = pendientes.filter(p => !hidden.has(p.id))
    return {
      duplicados: visible.filter(p => p.tipo === 'gasto' && p.coincidencias.length && !noEsDuplicado.has(p.id)),
      recibidos: visible.filter(p => p.tipo === 'ingreso'),
      nuevos: visible.filter(p => p.tipo === 'gasto' && (!p.coincidencias.length || noEsDuplicado.has(p.id))),
    }
  }, [pendientes, hidden, noEsDuplicado])
  const groups = { nuevos, duplicados, recibidos }
  // Contador del servidor menos lo que ya se está guardando en esta página.
  const tabCount = (value: Tab) => meta ? meta.counts[value] - pendientes.filter(p => hidden.has(p.id) && tabOf(p, noEsDuplicado) === value).length : groups[value].length
  const goTo = (next: Tab) => { setTab(next); setPage(1) }
  const matchesSearch = (p: Pendiente) => `${p.descripcion} ${p.descripcion_original ?? ''} ${p.origen} ${p.fecha}`.toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es'))
  const rows = groups[tab].filter(matchesSearch)
  const chosen = nuevos.filter(p => selected.has(p.id))
  const visibleNew = nuevos.filter(matchesSearch)
  const allSelected = visibleNew.length > 0 && visibleNew.every(p => selected.has(p.id))
  const total = chosen.reduce((sum, p) => sum + (mitadPor[p.id] ? half(p.monto) : p.monto), 0)
  const category = (p: Pendiente) => categoriaPor[p.id] ?? p.categoria_id
  const validCategory = (p: Pendiente) => categorias.some(c => c.id === category(p))
  const aliasDraft = (p: Pendiente) => p.destinatario ? aliasDrafts[p.destinatario] ?? p.alias ?? '' : ''
  const aliasDirty = (p: Pendiente) => aliasDraft(p).trim() !== (p.alias ?? '')
  const saveAs = (p: Pendiente) => descriptionDrafts[p.id] ?? p.descripcion
  const validDescription = (p: Pendiente) => saveAs(p).trim().length > 0 && saveAs(p).trim().length <= 200
  const canAccept = (p: Pendiente) => validCategory(p) && validDescription(p) && !aliasDirty(p) && aliasSaving === null

  async function saveAlias(p: Pendiente) {
    if (!p.destinatario || syncing || inFlight || aliasSaving !== null) return
    const alias = aliasDraft(p).trim()
    setAliasSaving(p.destinatario)
    try {
      const response = await fetch(API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, alias }) })
      const body = await response.json().catch(() => null)
      if (!response.ok || body?.destinatario !== p.destinatario || body?.alias !== alias) throw new Error(body?.error || 'No se pudo confirmar el alias.')
      if (!mounted.current) return
      ++loadVersion.current
      setPendientes(prev => prev.map(row => row.destinatario === p.destinatario ? { ...row, alias, descripcion: alias || row.descripcion_original || row.descripcion } : row))
      setAliasDrafts(prev => { const next = { ...prev }; delete next[p.destinatario!]; return next })
      toast.success(alias ? 'Alias guardado para próximas transferencias' : 'Alias eliminado')
      await load()
    } catch (cause) { toast.error((cause as Error).message || 'No se pudo guardar el alias.') }
    finally { if (mounted.current) setAliasSaving(null) }
  }

  function enqueue(p: Pendiente, payload: object, countKey: 'aceptados' | 'descartados' | 'vinculados', label: string) {
    if (syncing) return
    const added = queue.current!.enqueue({ id: p.id, label, execute: async () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120000)
      try {
        const response = await fetch(API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal })
        const body = await response.json().catch(() => null)
        if (!response.ok) throw new Error(body?.error || 'No se pudo confirmar el guardado. Revisa antes de reintentar.')
        if (body?.[countKey] !== 1) throw new Error('El movimiento ya cambió. Actualizaremos la lista; no se confirmó una nueva operación.')
      } finally { clearTimeout(timeout) }
    } })
    if (added) {
      setSelected(prev => { const next = new Set(prev); next.delete(p.id); return next })
    }
  }
  function aceptar(list: Pendiente[]) {
    list.filter(canAccept).forEach(p => enqueue(p, { aceptar: [{ id: p.id, categoria_id: category(p), ...(descriptionDrafts[p.id] !== undefined ? { descripcion: saveAs(p).trim() } : {}), ...(mitadPor[p.id] ? { monto: half(p.monto) } : {}) }] }, 'aceptados', `Gasto registrado · ${saveAs(p).trim()}`))
  }
  const descartar = (p: Pendiente) => enqueue(p, { descartar: [p.id] }, 'descartados', `Descartado · ${p.descripcion}`)
  async function sync() {
    if (syncing || queue.current!.pendingCount() || aliasSaving !== null) return
    setSyncing(true); setMessage('')
    const id = toast.loading('Buscando movimientos nuevos…')
    try {
      const response = await fetch(API, { method: 'POST' })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.error || 'No se pudo sincronizar.')
      toast.success(body.nuevos ? `${body.nuevos} movimientos nuevos.` : 'No hay movimientos nuevos.', { id })
      await load()
    } catch (cause) { toast.error((cause as Error).message || 'No se pudo conectar.', { id }) }
    finally { if (mounted.current) setSyncing(false) }
  }
  const toggle = (id: number) => setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  const description = { nuevos: 'Elige la categoría y registra solo los gastos que correspondan.', duplicados: 'Compara antes de registrar: vincular conserva tu gasto sin crear otro.', recibidos: 'Descuenta una devolución de un gasto existente o descártala.' }

  return (
    <PageShell fill>
      <PageTitle customTitle="Correo - BethaSpend" />
      <PageHeader title="Correo" description="Revisa tus movimientos antes de registrarlos."
        actions={<Button variant="outline" disabled={enabled !== true || syncing || inFlight > 0 || aliasSaving !== null} onClick={sync}><RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />{syncing ? 'Sincronizando…' : 'Sincronizar'}</Button>} />
      {loadError && <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 p-3" role="alert"><p className="min-w-0 flex-1 text-sm">{loadError}</p><Button variant="outline" size="sm" disabled={inFlight > 0 || syncing} onClick={() => void load()}>Reintentar</Button></div>}
      {message && <p className="mb-4 text-sm" role="status">{message}</p>}
      {enabled === false ? <Empty title="Correo no habilitado" text="La importación desde Yahoo no está habilitada para esta cuenta." /> : enabled === null ? (
        !loadError && <div className="flex min-h-48 items-center justify-center gap-2 text-sm" role="status"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Cargando movimientos…</div>
      ) : <Tabs value={tab} onValueChange={value => goTo(value as Tab)} className="lg:fill-y">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList aria-label="Clasificación de movimientos" className="grid h-auto w-full grid-cols-3 sm:w-auto">
            {([['nuevos', 'Nuevos'], ['duplicados', 'Duplicados'], ['recibidos', 'Recibidos']] as const).map(([value, label]) => (
              <TabsTrigger key={value} value={value} data-review-tab className="min-h-11 min-w-0 gap-1.5 px-2 text-xs sm:min-h-0 sm:px-3 sm:text-[13px]"><span>{label}</span><span className="rounded bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">{tabCount(value)}</span></TabsTrigger>
            ))}
          </TabsList>
          <div className="relative w-full sm:max-w-60"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input aria-label="Buscar movimientos" placeholder="Buscar movimiento…" value={search} onChange={event => setSearch(event.target.value)} className="h-11 pl-9 text-base sm:h-9 sm:text-[13px]" /></div>
        </div>
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 py-3">
          <p className="text-[13px] text-muted-foreground">{description[tab]}</p>
          {inFlight > 0 && <span className="inline-flex items-center gap-1.5 text-xs" role="status"><Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />{inFlight} en cola · no cierres esta pestaña</span>}
        </div>
        {(['nuevos', 'duplicados', 'recibidos'] as const).map(value => <TabsContent key={value} value={value} className="mt-0 lg:fill-y">
          {value === tab && <>
            {tab === 'nuevos' && rows.length > 0 && <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border bg-card px-4 py-2">
              <label className="mr-auto flex min-h-11 cursor-pointer items-center gap-2.5 text-[13px] sm:min-h-9"><input type="checkbox" className="h-4 w-4 accent-primary" aria-label="Seleccionar todos los nuevos visibles" checked={allSelected} disabled={syncing} onChange={() => setSelected(prev => { const next = new Set(prev); visibleNew.forEach(p => allSelected ? next.delete(p.id) : next.add(p.id)); return next })} />{chosen.length ? `${chosen.length} seleccionados · ${money.format(total)}` : 'Seleccionar visibles'}</label>
              <Button size="sm" className="min-h-11 sm:min-h-0" disabled={syncing || !chosen.length || chosen.some(p => !canAccept(p))} onClick={() => aceptar(chosen)}>Aceptar selección</Button>
              <Button size="sm" variant="outline" className="min-h-11 sm:min-h-0" disabled={syncing || !chosen.length} onClick={() => chosen.forEach(descartar)}>Descartar selección</Button>
            </div>}
            {!rows.length && loading ? <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground" role="status"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Cargando…</div> : !rows.length ? <Empty title={search ? 'Sin coincidencias' : inFlight ? 'Guardando tus decisiones' : gruposEmpty(tab)} text={search ? 'Prueba con otra descripción, fecha o banco.' : inFlight ? 'Puedes cambiar de clasificación mientras terminan de guardarse.' : 'Los movimientos de esta clasificación aparecerán aquí.'} /> : (
              <div key={`${tab}-${page}`} className={`${styles.wrap} transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}><table className={styles.table} data-classification={tab}>
                <caption className="sr-only">Movimientos de correo: {tab}</caption>
                <thead><tr>{tab === 'nuevos' && <th scope="col"><span className="sr-only">Selección</span></th>}<th scope="col">Movimiento</th>{tab === 'nuevos' ? <><th scope="col">Categoría</th><th scope="col">Tu parte</th></> : <th scope="col">{tab === 'duplicados' ? 'Gasto existente' : 'Descontar de'}</th>}<th scope="col" className="text-right">Importe</th><th scope="col">Acciones</th></tr></thead>
                <tbody>{rows.map(p => {
                  const elegido = p.coincidencias.find(c => c.gasto.id === elegidoPor[p.id]) ?? p.coincidencias[0]
                  return <tr key={p.id}>
                    {tab === 'nuevos' && <td className={styles.selection}><label className="inline-flex min-h-11 min-w-6 items-center"><input type="checkbox" className="h-4 w-4 accent-primary" disabled={syncing} checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Seleccionar ${p.descripcion}`} /></label></td>}
                    <td data-label="Movimiento" className={styles.movement}>
                      <p className="font-medium text-foreground break-words">{p.descripcion}</p>
                      {p.alias && <p className="mt-1 break-words text-xs text-muted-foreground">{p.descripcion_original}</p>}
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"><span className="tabular-nums">{p.fecha}</span><span className="rounded-md border bg-muted/50 px-1.5 text-[11px] leading-4">{p.origen}</span></p>
                      {p.destinatario && <details className="mt-2 text-xs text-muted-foreground">
                        <summary className="cursor-pointer py-1 hover:text-foreground">{p.alias ? 'Editar alias' : 'Asignar alias'}</summary>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Input aria-label={`Alias para ${p.descripcion_original ?? p.descripcion}`} placeholder="Ej. Gimnasio" maxLength={200} value={aliasDraft(p)} disabled={syncing || inFlight > 0 || aliasSaving !== null} onChange={e => setAliasDrafts(prev => ({ ...prev, [p.destinatario!]: e.target.value }))} className="h-11 min-w-0 flex-1 text-base sm:h-8 sm:text-[13px]" />
                          <Button size="sm" variant="outline" className="min-h-11 sm:min-h-0" aria-label={`Guardar alias para ${p.descripcion_original ?? p.descripcion}`} disabled={syncing || inFlight > 0 || aliasSaving !== null || !aliasDirty(p)} onClick={() => saveAlias(p)}>{aliasSaving === p.destinatario ? 'Guardando…' : aliasDraft(p).trim() ? 'Guardar' : 'Quitar alias'}</Button>
                        </div>
                        <p className="mt-1">Se usará para este destinatario en próximos gastos. Vacíalo para quitarlo.</p>
                        {aliasDirty(p) && <p className="mt-1 text-foreground" role="status">Guarda el alias antes de aceptar.</p>}
                      </details>}
                      {tab === 'nuevos' && <div className="mt-2">
                        <label htmlFor={`guardar-como-${p.id}`} className="text-xs text-muted-foreground">Guardar como</label>
                        <Input id={`guardar-como-${p.id}`} aria-label={`Guardar como para ${p.descripcion_original ?? p.descripcion}`} aria-describedby={`guardar-como-ayuda-${p.id}`} aria-invalid={!validDescription(p)} placeholder="Ej. Almuerzo, taxi, regalo…" maxLength={200} value={saveAs(p)} disabled={syncing} onChange={e => setDescriptionDrafts(prev => ({ ...prev, [p.id]: e.target.value }))} className="mt-1 h-11 w-full min-w-0 text-base sm:h-8 sm:text-[13px]" />
                        <p id={`guardar-como-ayuda-${p.id}`} className={`mt-1 text-xs ${validDescription(p) ? 'text-muted-foreground' : 'text-destructive'}`}>{validDescription(p) ? 'Solo para este gasto; no cambia el alias.' : 'Escribe una razón de entre 1 y 200 caracteres.'}</p>
                      </div>}
                      {errors.get(p.id) && <p className="mt-2 text-xs text-destructive" role="alert">{errors.get(p.id)}</p>}
                    </td>
                    {tab === 'nuevos' ? <>
                      <td data-label="Categoría"><select className={selectClass} disabled={syncing} aria-label={`Categoría de ${p.descripcion}`} value={category(p) ?? ''} onChange={e => setCategoriaPor(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}><option value="" disabled>Elegir categoría</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></td>
                      <td data-label="Tu parte"><select className={selectClass} disabled={syncing} aria-label={`Parte de ${p.descripcion}`} value={mitadPor[p.id] ? 'mitad' : 'todo'} onChange={e => setMitadPor(prev => ({ ...prev, [p.id]: e.target.value === 'mitad' }))}><option value="todo">Total</option><option value="mitad">Mitad</option></select></td>
                    </> : <td data-label={tab === 'duplicados' ? 'Gasto existente' : 'Descontar de'} className={styles.match}>
                      {elegido ? <>
                        <select className={selectClass} disabled={syncing} aria-label={`Gasto existente para ${p.descripcion}`} value={elegido.gasto.id} onChange={e => setElegidoPor(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}>{p.coincidencias.map(c => <option key={c.gasto.id} value={c.gasto.id}>{c.gasto.descripcion} · {money.format(c.gasto.monto)}</option>)}</select>
                        <p className="mt-1.5 text-xs text-muted-foreground">{elegido.gasto.fecha}{tab === 'recibidos' ? ` · Quedará en ${money.format(elegido.gasto.monto - p.monto)}` : ` · ${elegido.kind === 'mitad' ? 'Registraste la mitad' : 'Mismo monto'} · ${elegido.dias ? `${elegido.dias} día(s) de diferencia` : 'Mismo día'}`}</p>
                        {tab === 'duplicados' && <details className="mt-1 text-xs text-muted-foreground"><summary className="cursor-pointer py-1 hover:text-foreground">Ver comparación</summary><p className="py-1 break-words">{elegido.gasto.descripcion}{elegido.gasto.categoria ? ` · ${elegido.gasto.categoria.nombre}` : ''}. {elegido.veredicto === 'encaja' ? 'El comercio encaja con tu descripción.' : elegido.veredicto === 'desconocido' ? 'El correo no especifica qué se compró.' : 'Coincidencia por fecha e importe; confirma antes de vincular.'}</p></details>}
                      </> : <p className="text-xs text-muted-foreground">No hay un gasto compatible de los últimos 20 días.</p>}
                    </td>}
                    <td data-label={tab === 'recibidos' ? 'Recibido' : 'Importe'} className={styles.amount}><span className="font-semibold tabular-nums">{tab === 'recibidos' ? '+' : ''}{money.format(tab === 'nuevos' && mitadPor[p.id] ? half(p.monto) : p.monto)}</span>{tab === 'nuevos' && mitadPor[p.id] && <span className="mt-0.5 block text-xs text-muted-foreground">de {money.format(p.monto)}</span>}</td>
                    <td data-label="Acciones" className={styles.actions}>
                      <div className={`flex items-center gap-1.5 ${tab === 'nuevos' ? '' : 'flex-wrap'}`}>
                        {tab === 'nuevos' ? <>
                          <Button size="sm" className="min-h-11 sm:min-h-0" disabled={syncing || !canAccept(p)} aria-label={`Aceptar ${p.descripcion}`} onClick={() => aceptar([p])}><Check aria-hidden="true" />Aceptar</Button>
                          <Button size="sm" variant="ghost" className="min-h-11 text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:min-h-0 sm:w-8 sm:px-0" disabled={syncing} aria-label={`Descartar ${p.descripcion}`} title="Descartar" onClick={() => descartar(p)}><X aria-hidden="true" /><span className="sm:sr-only">Descartar</span></Button>
                        </> : <>
                          {elegido && <Button size="sm" className="min-h-11 sm:min-h-0" disabled={syncing || (tab === 'recibidos' && elegido.gasto.monto <= p.monto)} onClick={() => enqueue(p, { vincular: [{ id: p.id, gasto_id: elegido.gasto.id }] }, 'vinculados', `${tab === 'duplicados' ? 'Vinculado sin duplicar' : 'Devolución descontada'} · ${p.descripcion}`)}>{tab === 'duplicados' ? 'Es el mismo' : 'Descontar'}</Button>}
                          {tab === 'duplicados' ? <Button size="sm" variant="outline" className="min-h-11 sm:min-h-0" disabled={syncing} onClick={() => { setNoEsDuplicado(prev => new Set(prev).add(p.id)); goTo('nuevos') }}>Es otro gasto</Button> : null}
                          <Button size="sm" variant="ghost" className="min-h-11 text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:min-h-0" disabled={syncing} onClick={() => descartar(p)}>Descartar</Button>
                        </>}
                      </div>
                    </td>
                  </tr>
                })}</tbody>
              </table></div>
            )}
            {meta && meta.pages > 1 && <nav aria-label="Paginación" className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="tabular-nums">{(meta.page - 1) * PAGE_SIZE + 1}–{Math.min(meta.page * PAGE_SIZE, meta.total)} de {meta.total}</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={meta.page <= 1 || loading} onClick={() => setPage(meta.page - 1)}>Anterior</Button>
                <span className="tabular-nums">Página {meta.page} de {meta.pages}</span>
                <Button size="sm" variant="outline" disabled={meta.page >= meta.pages || loading} onClick={() => setPage(meta.page + 1)}>Siguiente</Button>
              </div>
            </nav>}
          </>}
        </TabsContent>)}
      </Tabs>}
    </PageShell>
  )
}
function gruposEmpty(tab: Tab) { return { nuevos: 'No hay gastos nuevos por revisar', duplicados: 'No hay posibles duplicados', recibidos: 'No hay transferencias recibidas' }[tab] }
function Empty({ title, text }: { title: string; text: string }) {
  return <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center"><Inbox className="mb-1 h-6 w-6 text-muted-foreground" aria-hidden="true" /><h2 className="text-sm font-medium">{title}</h2><p className="max-w-sm text-sm text-muted-foreground">{text}</p></div>
}
