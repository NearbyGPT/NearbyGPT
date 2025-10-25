'use client'

import useGeneralStore from '@/store/generalStore'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function RestaurantPanel() {
  const { selectedRestaurant, isPanelOpen, setPanelOpen } = useGeneralStore()

  // ---------- Manual draggable bottom sheet state ----------
  const [heightPx, setHeightPx] = useState<number>(0)
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef<{ startY: number; startHeight: number } | null>(null)

  useEffect(() => {
    setHeightPx(Math.round(window.innerHeight * 0.9))
  }, [])

  // update height when /isPanelOpen changes
  useEffect(() => {
    if (isPanelOpen) {
      setHeightPx(Math.round(window.innerHeight * 0.9))
    }
  }, [, isPanelOpen])

  // handle window resize to scale height proportionally
  useEffect(() => {
    const onResize = () => {
      // keep percentage roughly the same
      const vh = window.innerHeight
      // clamp existing height to new viewport
      setHeightPx((prev) => Math.min(Math.max(prev, Math.round(vh * 0.15)), vh))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // helper to clamp and set by px
  const clampAndSet = useCallback((px: number) => {
    const vh = window.innerHeight
    const min = Math.round(vh * 0.15) // 15% min
    const max = vh // full viewport
    const clamped = Math.min(Math.max(px, min), max)
    setHeightPx(clamped)
    return clamped
  }, [])

  // pointer event handlers
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return
      // calculate delta Y
      const deltaY = e.clientY - draggingRef.current.startY
      const newHeight = draggingRef.current.startHeight - deltaY
      clampAndSet(Math.round(newHeight))
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!draggingRef.current) return
      // finalize
      const vh = window.innerHeight
      const currentHeight = draggingRef.current.startHeight - (e.clientY - draggingRef.current.startY)
      const clamped = clampAndSet(Math.round(currentHeight))

      // if user swiped down past threshold (e.g., below 20% of viewport) -> setPanelOpen
      const closeThreshold = Math.round(vh * 0.2)
      if (clamped <= closeThreshold) {
        // animate collapse before calling setPanelOpen
        setHeightPx(Math.round(vh * 0.0)) // set to 0px visually (instant), then setPanelOpen
        // small timeout to allow UI update (not async heavy; immediate)
        requestAnimationFrame(() => {
          setPanelOpen(false)
        })
      } else {
        // optional: snap to nearest useful snap points: 90%, 60%, 30%
        const perc = clamped / vh
        const snapPoints = [0.9, 0.6, 0.3]
        let best = snapPoints[0]
        let bestDiff = Math.abs(perc - snapPoints[0])
        for (let i = 1; i < snapPoints.length; i++) {
          const d = Math.abs(perc - snapPoints[i])
          if (d < bestDiff) {
            best = snapPoints[i]
            bestDiff = d
          }
        }
        const snapPx = Math.round(best * vh)
        clampAndSet(snapPx)
      }

      // release pointer capture and cleanup
      try {
        ;(e.target as Element).releasePointerCapture?.(e.pointerId)
      } catch (err) {
        // ignore
      }
      draggingRef.current = null
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerUp)
    }

    // cleanup function if sheet ref changes or unmounts
    return () => {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerUp)
    }
  }, [clampAndSet, setPanelOpen])

  // attach pointerdown to handle via callback to ensure stable identity
  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // only left button or touch/stylus
      if (e.button && e.button !== 0) return
      e.preventDefault()
      const startY = e.clientY
      const startHeight = sheetRef.current ? sheetRef.current.getBoundingClientRect().height : heightPx
      draggingRef.current = { startY, startHeight }

      // capture pointer on the target so move/up are received reliably
      try {
        ;(e.target as Element).setPointerCapture?.(e.pointerId)
      } catch (err) {
        // ignore if capture fails
      }

      // add global listeners
      const onPointerMove = (ev: PointerEvent) => {
        if (!draggingRef.current) return
        const deltaY = ev.clientY - draggingRef.current.startY
        const newHeight = draggingRef.current.startHeight - deltaY
        clampAndSet(Math.round(newHeight))
      }
      const onPointerUp = (ev: PointerEvent) => {
        if (!draggingRef.current) return
        const vh = window.innerHeight
        const currentHeight = draggingRef.current.startHeight - (ev.clientY - draggingRef.current.startY)
        const clamped = clampAndSet(Math.round(currentHeight))
        const closeThreshold = Math.round(vh * 0.2)
        if (clamped <= closeThreshold) {
          // collapse and close
          setHeightPx(0)
          draggingRef.current = null
          requestAnimationFrame(() => setPanelOpen(false))
        } else {
          // snap to nearest snap point
          const perc = clamped / vh
          const snapPoints = [0.9, 0.6, 0.3]
          let best = snapPoints[0]
          let bestDiff = Math.abs(perc - snapPoints[0])
          for (let i = 1; i < snapPoints.length; i++) {
            const d = Math.abs(perc - snapPoints[i])
            if (d < bestDiff) {
              best = snapPoints[i]
              bestDiff = d
            }
          }
          const snapPx = Math.round(best * vh)
          clampAndSet(snapPx)
        }

        try {
          ;(ev.target as Element).releasePointerCapture?.(ev.pointerId)
        } catch (err) {
          // ignore
        }
        draggingRef.current = null
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
        document.removeEventListener('pointercancel', onPointerUp)
      }

      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
      document.addEventListener('pointercancel', onPointerUp)
    },
    [clampAndSet, heightPx, setPanelOpen]
  )

  if (!isPanelOpen || !selectedRestaurant) return null

  if (!isPanelOpen) {
    // fully reset state (avoids "ghost panel" case)
    draggingRef.current = null
    heightPx !== 0 && setHeightPx(0)
    return null
  }

  return (
    <div
      ref={sheetRef}
      className="absolute bottom-0 left-0 w-full h-[90vh] bg-[#F5F7EE] shadow-xl rounded-t-2xl flex flex-col overflow-hidden animate-slideUp pointer-events-auto p-4"
      style={{ height: `${heightPx}px`, transition: draggingRef.current ? 'none' : 'height 200ms ease' }}
      role="dialog"
      aria-modal="true"
    >
      {/* drag handle */}
      <div
        className="w-full h-2 bg-[#89984E] my-2 mx-auto max-w-[40px] cursor-grab rounded-full"
        onPointerDown={onHandlePointerDown}
        role="button"
        aria-label="Resize panel"
        style={{ touchAction: 'none' }} // important to prevent double-touch scroll conflict
      />

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold">{selectedRestaurant?.name}</h1>
      </div>
      <p className="text-gray-500 text-sm mb-2">Alper Apt, Türkkali, Mecit Ali Sk. D:16A, Beşiktaş</p>
      <p className="text-green-600 font-medium mb-4">open Friday: 12:00–10:00PM</p>
      <div className="flex items-center justify-center gap-x-2">
        <div className="mb-4 p-3 bg-gray-100 rounded-xl">
          <h3 className="font-medium mb-1">🍔 truffle burgers</h3>
          <p className="text-sm text-gray-600 mt-2">
            Quiet neighborhood burger spot with perfect truffle and bacon smash burgers + killer sun-dried tomato sauce
          </p>
        </div>
        <div className="flex items-center justify-between">
          <Carousel
            opts={{
              align: 'start',
            }}
            orientation="horizontal"
            className="w-full max-w-xs"
          >
            <CarouselContent className="-mt-1 h-[200px]">
              {Array.from({ length: 5 }).map((_, index) => (
                <CarouselItem key={index} className="pr-1 md:basis-1/2 bg-gray-600">
                  <div className="p-1">
                    <span className="text-3xl font-semibold">{index + 1}</span>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>

      {/* <div className="text-lg font-semibold mb-2">places you&apos;ll also like</div>
      <div className="flex-1 overflow-x-scroll flex space-x-3">
        <div className="min-w-[200px] h-40 bg-gray-200 rounded-2xl" />
        <div className="min-w-[200px] h-40 bg-gray-200 rounded-2xl" />
      </div>
      <div className="mt-4 flex justify-around text-sm">
        <button className="px-4 py-2 rounded-full border">directions</button>
        <button className="px-4 py-2 rounded-full border">site</button>
        <button className="px-4 py-2 rounded-full border">ig</button>
      </div> */}
    </div>
  )
}
