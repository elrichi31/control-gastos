import { clearPrivateCaches } from '../src/lib/pwa/cache-policy'

// Upgrade existing installations: removing a caching rule does not delete old data.
self.addEventListener('activate', event => {
  event.waitUntil(clearPrivateCaches())
})
