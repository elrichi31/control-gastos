export default function Loading() {
  return <div role="status" aria-live="polite" className="space-y-4 p-6">
    <p className="text-sm text-muted-foreground">Cargando página…</p>
    <div aria-hidden="true" className="h-24 rounded-xl bg-muted motion-safe:animate-pulse" />
    <div aria-hidden="true" className="h-80 rounded-xl bg-muted motion-safe:animate-pulse" />
  </div>
}
