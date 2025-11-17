'use client'

import React, { useEffect, useRef, useState } from 'react'

type BottomSheetProps = {
  children: React.ReactNode
  /** translateY snap points in %, e.g. [100 (hidden), 65 (peek), 0 (open)] */
  snapPoints?: number[]
  /** initial translateY in %, should be one of snapPoints */
  initialSnap?: number
  /** called when sheet snaps to fully hidden (100%) */
  onClose?: () => void
}

const DEFAULT_SNAP_POINTS = [100, 65, 0]
const DEFAULT_INITIAL_SNAP = 65

export const BottomSheet: React.FC<BottomSheetProps> = ({
  children,
  snapPoints = DEFAULT_SNAP_POINTS,
  initialSnap = DEFAULT_INITIAL_SNAP,
  onClose,
}) => {
  const [translateY, _setTranslateY] = useState(initialSnap)
  const translateYRef = useRef(initialSnap)

  const [isDragging, setIsDragging] = useState(false)

  const draggingRef = useRef(false)
  const startYRef = useRef(0)
  const startTranslateYRef = useRef(initialSnap)

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

  const setTranslateY = (value: number) => {
    const clamped = clamp(value, 0, 100)
    translateYRef.current = clamped
    _setTranslateY(clamped)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only start drag with primary button / touch
    if (e.button !== 0) return

    e.preventDefault() // stop text selection / scroll
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    draggingRef.current = true
    setIsDragging(true)
    startYRef.current = e.clientY
    startTranslateYRef.current = translateYRef.current
  }

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return
      const deltaY = e.clientY - startYRef.current
      const vh = window.innerHeight || 1
      const deltaPercent = (deltaY / vh) * 100
      const next = startTranslateYRef.current + deltaPercent
      setTranslateY(next)
    }

    const handlePointerUp = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      setIsDragging(false)

      // snap to nearest snap point
      const current = translateYRef.current
      let nearest = snapPoints[0]
      let minDiff = Math.abs(current - nearest)
      for (const p of snapPoints) {
        const diff = Math.abs(current - p)
        if (diff < minDiff) {
          minDiff = diff
          nearest = p
        }
      }
      setTranslateY(nearest)

      if (nearest === 100 && onClose) {
        onClose()
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [snapPoints, onClose])

  const openness = 1 - translateY / 100 // 0..1

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-200 ${
          openness > 0.05 ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{ opacity: openness * 0.5 }}
        onClick={() => {
          setTranslateY(100)
          if (onClose) onClose()
        }}
      />

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 flex flex-col rounded-t-2xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.2)] will-change-transform"
        style={{
          height: '80vh',
          transform: `translateY(${translateY}%)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          touchAction: 'none', // don't let browser handle pan
        }}
      >
        {/* Drag handle area */}
        <div
          className="flex flex-col items-center gap-2 border-b border-gray-100 px-4 py-3 select-none cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
        >
          <div className="h-1 w-10 rounded-full bg-gray-300" />
          <span className="text-xs font-medium text-gray-500">Pull up for more</span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2">{children}</div>
      </div>
    </>
  )
}
