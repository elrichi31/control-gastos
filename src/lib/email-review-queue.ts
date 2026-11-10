export type ReviewJob = { id: number; label: string; status: 'queued' | 'saving' | 'success' | 'error'; error?: string }
type Item = { id: number; label: string }
/** execute puede devolver id → error para los elementos de un lote que no se guardaron. */
type Execute = (signal?: AbortSignal) => Promise<void | Map<number, string>>
type Task = Item & { execute: Execute }
type Group = { items: Item[]; execute: Execute }
type Events = { onChange?: (jobs: ReviewJob[]) => void; onFeedback?: (job: ReviewJob) => void; onIdle?: () => void }

/** Session-only, serial writes. No automatic retries of financial mutations. */
export function createEmailReviewQueue(events: Events = {}) {
  const jobs = new Map<number, ReviewJob>()
  const waiting: Group[] = []
  const idleResolvers: (() => void)[] = []
  let running = false
  let disposed = false
  let active: AbortController | null = null
  const snapshot = () => Array.from(jobs.values(), job => ({ ...job }))
  const pendingCount = () => snapshot().filter(job => job.status === 'queued' || job.status === 'saving').length
  function update(task: Item, status: ReviewJob['status'], error?: string) {
    const job: ReviewJob = { id: task.id, label: task.label, status, ...(error ? { error } : {}) }
    jobs.set(task.id, job)
    if (!disposed) {
      events.onChange?.(snapshot())
      events.onFeedback?.({ ...job })
    }
  }
  async function drain() {
    if (running) return
    running = true
    while (waiting.length && !disposed) {
      const group = waiting.shift()!
      group.items.forEach(item => update(item, 'saving'))
      active = new AbortController()
      try {
        const failed = await group.execute(active.signal)
        group.items.forEach(item => failed?.has(item.id) ? update(item, 'error', failed.get(item.id)) : update(item, 'success'))
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'No se pudo guardar. Revisa el movimiento antes de reintentar.'
        group.items.forEach(item => update(item, 'error', message))
      }
    }
    running = false
    events.onIdle?.()
    idleResolvers.splice(0).forEach(resolve => resolve())
  }
  /** Varios movimientos en una sola petición. `build` recibe solo los ids que entraron a la cola
   *  (sin dobles clics) y arma el envío. Devuelve esos ids. */
  function enqueueGroup(items: Item[], build: (ids: number[]) => Execute): number[] {
    if (disposed) return []
    const fresh = items.filter((item, i) => {
      const existing = jobs.get(item.id)
      return (!existing || existing.status === 'error') && items.findIndex(other => other.id === item.id) === i
    })
    if (!fresh.length) return []
    const ids = fresh.map(item => item.id)
    waiting.push({ items: fresh, execute: build(ids) })
    fresh.forEach(item => update(item, 'queued'))
    void drain()
    return ids
  }
  return {
    snapshot, pendingCount,
    dispose() { disposed = true; active?.abort(); for (const group of waiting.splice(0)) group.items.forEach(item => update(item, 'error', 'Sesión cerrada; operación no enviada.')) },
    enqueue: (task: Task) => enqueueGroup([task], () => task.execute).length > 0,
    enqueueGroup,
    whenIdle: () => running || waiting.length ? new Promise<void>(resolve => idleResolvers.push(resolve)) : Promise.resolve(),
  }
}

/** The browser session owns the queue and close guard, not any mounted page. */
export function createSessionEmailReviewQueue(onFeedback?: Events['onFeedback'], onIdle?: () => void, onDispose?: () => void) {
  const subscribers = new Set<Pick<Events, 'onChange' | 'onIdle'>>()
  let guarding = false
  const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
  const queue = createEmailReviewQueue({
    onFeedback,
    onChange: jobs => {
      const pending = jobs.some(job => job.status === 'queued' || job.status === 'saving')
      if (typeof window !== 'undefined' && pending !== guarding) {
        if (pending) window.addEventListener('beforeunload', warn)
        else window.removeEventListener('beforeunload', warn)
        guarding = pending
      }
      subscribers.forEach(listener => listener.onChange?.(jobs))
    },
    onIdle: () => { onIdle?.(); subscribers.forEach(listener => listener.onIdle?.()) },
  })
  return {
    ...queue,
    dispose() { queue.dispose(); onDispose?.(); if (typeof window !== 'undefined') window.removeEventListener('beforeunload', warn); subscribers.clear() },
    subscribe(listener: Pick<Events, 'onChange' | 'onIdle'>) {
      subscribers.add(listener)
      listener.onChange?.(queue.snapshot())
      return () => { subscribers.delete(listener) }
    },
  }
}
const sessionQueues = new WeakMap<object, ReturnType<typeof createSessionEmailReviewQueue>>()
const legacyOwner = {}
export function getSessionEmailReviewQueue(onFeedback?: Events['onFeedback'], owner: object = legacyOwner, onIdle?: () => void, onDispose?: () => void) {
  if (typeof window === 'undefined') return createSessionEmailReviewQueue(onFeedback, onIdle, onDispose)
  let queue = sessionQueues.get(owner)
  if (!queue) { queue = createSessionEmailReviewQueue(onFeedback, onIdle, onDispose); sessionQueues.set(owner, queue) }
  return queue
}
export function disposeSessionEmailReviewQueue(owner: object) {
  sessionQueues.get(owner)?.dispose()
  sessionQueues.delete(owner)
}
