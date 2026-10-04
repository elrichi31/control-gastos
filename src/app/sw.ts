import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist } from "serwist"
import { clearPrivateCaches, runtimeCaching } from "@/lib/pwa/cache-policy"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}
declare const self: ServiceWorkerGlobalScope

// Only the explicit policy in cache-policy.ts: Serwist's defaultCache would cache
// API responses and pages (NetworkFirst), which must never outlive a session.
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: runtimeCaching.map(route => ({
    matcher: route.urlPattern,
    handler: route.handler === "NetworkOnly"
      ? new NetworkOnly()
      : new CacheFirst({ cacheName: route.options.cacheName, plugins: [new ExpirationPlugin(route.options.expiration)] }),
  })),
})

// Upgrade existing installations: removing a caching rule does not delete old data.
self.addEventListener("activate", event => {
  event.waitUntil(clearPrivateCaches())
})

serwist.addEventListeners()
