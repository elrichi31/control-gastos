export type ReviewJob = { id: number; label: string; status: 'queued' | 'saving' | 'success' | 'error'; error?: string }
type Task = { id: number; label: string; execute: () => Promise<void> }
type Events = { onChange?: (jobs: ReviewJob[]) => void; onFeedback?: (job: ReviewJob) => void; onIdle?: () => void }

/** Session-only, serial writes. No automatic retries of financial mutations. */
export function createEmailReviewQueue(events: Events = {}) {
  const jobs = new Map<number, ReviewJob>()
  const waiting: Task[] = []
  const idleResolvers: (() => void)[] = []
  let running = false
  const snapshot = () => Array.from(jobs.values(), job => ({ ...job }))
  const pendingCount = () => snapshot().filter(job => job.status === 'queued' || job.status === 'saving').length
  function update(task: Task, status: ReviewJob['status'], error?: string) {
    const job: ReviewJob = { id: task.id, label: task.label, status, ...(error ? { error } : {}) }
    jobs.set(task.id, job)
    events.onChange?.(snapshot())
    events.onFeedback?.({ ...job })
  }
  async function drain() {
    if (running) return
    running = true
    while (waiting.length) {
      const task = waiting.shift()!
      update(task, 'saving')
      try { await task.execute(); update(task, 'success') }
      catch (cause) { update(task, 'error', cause instanceof Error ? cause.message : 'No se pudo guardar. Revisa el movimiento antes de reintentar.') }
    }
    running = false
    events.onIdle?.()
    idleResolvers.splice(0).forEach(resolve => resolve())
  }
  return {
    snapshot, pendingCount,
    enqueue(task: Task) {
      const existing = jobs.get(task.id)
      if (existing && existing.status !== 'error') return false
      waiting.push(task)
      update(task, 'queued')
      void drain()
      return true
    },
    whenIdle: () => running || waiting.length ? new Promise<void>(resolve => idleResolvers.push(resolve)) : Promise.resolve(),
  }
}

/** The browser session owns the queue and close guard, not any mounted page. */
export function createSessionEmailReviewQueue(onFeedback?: Events['onFeedback']) {
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
    onIdle: () => subscribers.forEach(listener => listener.onIdle?.()),
  })
  return {
    ...queue,
    subscribe(listener: Pick<Events, 'onChange' | 'onIdle'>) {
      subscribers.add(listener)
      listener.onChange?.(queue.snapshot())
      return () => { subscribers.delete(listener) }
    },
  }
}
let sessionQueue: ReturnType<typeof createSessionEmailReviewQueue> | undefined
export function getSessionEmailReviewQueue(onFeedback?: Events['onFeedback']) {
  // Never share server-rendered state between authenticated users.
  if (typeof window === 'undefined') return createSessionEmailReviewQueue(onFeedback)
  return sessionQueue ??= createSessionEmailReviewQueue(onFeedback)
}
