const privateCacheNames = new Set(['api-cache', 'supabase-api-cache', 'start-url', 'image-cache'])

// Shared by the browser logout path and the worker upgrade, without importing auth.
export async function clearPrivateCaches(
  storage: Pick<CacheStorage, 'keys' | 'delete'> | undefined = typeof caches === 'undefined' ? undefined : caches,
): Promise<boolean> {
  if (!storage) return true
  try {
    const names = await storage.keys()
    const results = await Promise.all(names.filter(name => privateCacheNames.has(name)).map(name => storage.delete(name)))
    return results.every(Boolean)
  } catch {
    // Cache Storage may be unavailable in restricted browser contexts; logout still proceeds.
    return false
  }
}

export const runtimeCaching = [
  {
    // Must be first: even private URLs ending in .png must never reach asset caching.
    // Plain data so it stays testable; src/app/sw.ts maps it to Serwist strategies.
    urlPattern: ({ url, request }: { url: URL; request: Request }) =>
      url.pathname === '/api' || url.pathname.startsWith('/api/') ||
      /(?:^|\.)supabase\.co$/i.test(url.hostname) ||
      request.headers.has('authorization') || request.headers.has('apikey'),
    handler: 'NetworkOnly' as const,
  },
  {
    urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
    handler: 'CacheFirst' as const,
    options: {
      cacheName: 'google-fonts',
      expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
    },
  },
]
