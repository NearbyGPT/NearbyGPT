'use client'
import { useEffect, useRef } from 'react'
import useServiceWorker from '@/hooks/useServiceWorker'
import { toast } from 'sonner'

export default function ServiceWorkerManager() {
  const { waitingWorker, promptUserToUpdate } = useServiceWorker()
  const hasShownToast = useRef(false)

  useEffect(() => {
    if (waitingWorker && !hasShownToast.current) {
      hasShownToast.current = true
      toast('A new version is available.', {
        id: 'update-available',
        duration: Infinity,
        action: {
          label: 'Update',
          onClick: promptUserToUpdate,
        },
      })
    }
  }, [waitingWorker, promptUserToUpdate])

  return null
}
