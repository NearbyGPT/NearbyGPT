const BUILD_ID = '__BUILD_ID__'
const CACHE_NAME = `NearbyGPT-cache-${BUILD_ID}`

self.addEventListener('install', () => {
  console.log('[SW] Installed (update detector only)')
  // Immediately activate the new SW
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up any old caches from previous versions
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      await self.clients.claim()
    })()
  )
})

// Allow the page to request immediate activation of the waiting SW
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING received — activating now')
    self.skipWaiting()
  }
})
