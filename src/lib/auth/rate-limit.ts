// Limitador en memoria (ventana fija). La app corre como un solo contenedor; si se escala a
// varias réplicas, cada una cuenta por separado y habría que moverlo a la base de datos.
const buckets = new Map<string, { count: number; resetAt: number }>()
const MAX_BUCKETS = 10_000

export function rateLimited(key: string, limit: number, windowMs: number, now = Date.now()) {
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
    if (buckets.size > MAX_BUCKETS) buckets.clear()
  }
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  bucket.count += 1
  return bucket.count > limit
}

// Detrás del proxy HTTPS el cliente llega en X-Forwarded-For (primer salto).
export function clientIp(headers: Headers | Record<string, string | string[] | undefined>) {
  const get = (name: string) => {
    const value = headers instanceof Headers ? headers.get(name) : headers[name]
    return Array.isArray(value) ? value[0] : value
  }
  return (get('x-forwarded-for') || get('x-real-ip') || 'unknown').split(',')[0].trim() || 'unknown'
}

export const LOGIN_LIMIT = { limit: 10, windowMs: 15 * 60_000 }
export const REGISTER_LIMIT = { limit: 5, windowMs: 60 * 60_000 }
