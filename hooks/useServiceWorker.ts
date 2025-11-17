import { useEffect, useState } from 'react'

export default function useServiceWorker() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    let registration: ServiceWorkerRegistration
    let updateInterval: NodeJS.Timeout

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        registration = reg

        // Immediately check for updates on load
        registration.update()

        // Set up periodic checks every 5 minutes
        updateInterval = setInterval(() => {
          console.log('[SW] Periodic update check...')
          registration.update()
        }, 1000 * 60 * 0.5)

        // If there's already a waiting worker, prompt immediately
        if (registration.waiting) {
          setWaitingWorker(registration.waiting)
        }

        // Detect when a new SW is found and installed
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && registration.waiting) {
              setWaitingWorker(registration.waiting)
            }
          })
        })
      })
      .catch((err) => {
        console.error('Service Worker registration failed:', err)
      })

    // Reload automatically when new SW takes control
    const onControllerChange = () => {
      setTimeout(() => window.location.reload(), 200)
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      clearInterval(updateInterval) // cleanup on unmount
    }
  }, [])

  function promptUserToUpdate() {
    if (!waitingWorker) return
    waitingWorker.postMessage({ type: 'SKIP_WAITING' })
  }

  return { waitingWorker, promptUserToUpdate }
}
