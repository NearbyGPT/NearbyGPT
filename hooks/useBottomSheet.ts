/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useBottomSheet.ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Options = {
  defaultSnap?: number
  snapPoints?: number[]
  closeThreshold?: number
  bounce?: boolean
  onClose?: () => void
  rubberbandLimitPx?: number
  animationDurationMs?: number
}

export default function useBottomSheet(options: Options = {}) {
  const {
    defaultSnap = 0.9,
    snapPoints = [0.9, 0.6, 0.3],
    closeThreshold = 0.2,
    bounce = true,
    onClose,
    rubberbandLimitPx = 120,
    animationDurationMs = 220,
  } = options

  // DOM node refs (we use callback refs to know when node is mounted)
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const handleRef = useRef<HTMLElement | null>(null)

  // setters for callback refs returned to consumer
  const setSheetRef = useCallback((el: HTMLDivElement | null) => {
    sheetRef.current = el
  }, [])
  const setHandleRef = useCallback((el: HTMLElement | null) => {
    handleRef.current = el
  }, [])

  // dragging and runtime state
  const draggingRef = useRef<{ startY: number; startHeight: number } | null>(null)
  const lastPointerRef = useRef<{ y: number; t: number } | null>(null)
  const rafRef = useRef<number | null>(null)

  // component state
  const [heightPx, setHeightPx] = useState<number>(0)
  const [transition, setTransition] = useState<string>('height 0ms linear')

  // helpers for viewport math
  const vh = useCallback(() => (typeof window !== 'undefined' ? window.innerHeight : 0), [])
  const pctToPx = useCallback((p: number) => Math.round(p * vh()), [vh])

  // rubberband calc
  const applyRubberband = useCallback((delta: number, limit: number) => {
    const sign = Math.sign(delta) || 1
    const abs = Math.abs(delta)
    const resisted = (limit * abs) / (abs + limit)
    return sign * resisted
  }, [])

  const clampWithRubberband = useCallback(
    (rawPx: number) => {
      const H = vh()
      const min = Math.round(H * Math.min(...snapPoints.map((s) => Math.min(s, 1))))
      const max = H
      if (!bounce) return Math.min(Math.max(Math.round(rawPx), min), max)

      if (rawPx < min) {
        const over = rawPx - min
        return Math.round(min + applyRubberband(over, rubberbandLimitPx))
      }
      if (rawPx > max) {
        const over = rawPx - max
        return Math.round(max + applyRubberband(over, rubberbandLimitPx))
      }
      return Math.round(rawPx)
    },
    [applyRubberband, bounce, rubberbandLimitPx, snapPoints, vh]
  )

  const nearestSnapPx = useCallback(
    (px: number) => {
      const H = vh()
      const perc = px / H
      let best = snapPoints[0]
      let bestDiff = Math.abs(perc - snapPoints[0])
      for (let i = 1; i < snapPoints.length; i++) {
        const d = Math.abs(perc - snapPoints[i])
        if (d < bestDiff) {
          best = snapPoints[i]
          bestDiff = d
        }
      }
      return pctToPx(best)
    },
    [pctToPx, snapPoints, vh]
  )

  // open/close imperatives
  const open = useCallback(() => {
    setTransition(`height ${animationDurationMs}ms cubic-bezier(.22,.9,.32,1)`)
    setHeightPx(pctToPx(defaultSnap))
  }, [animationDurationMs, defaultSnap, pctToPx])

  const close = useCallback(() => {
    setTransition(`height ${animationDurationMs}ms cubic-bezier(.22,.9,.32,1)`)
    // clear dragging so clamps won't fight closing animation
    draggingRef.current = null
    lastPointerRef.current = null
    setHeightPx(0)
    // call onClose after animation completes
    setTimeout(() => {
      onClose?.()
    }, animationDurationMs)
  }, [animationDurationMs, onClose])

  // attach pointer handlers to the handle element. We re-run effect only when handle or sheet changes.
  useEffect(() => {
    const handleEl = handleRef.current
    const sheetEl = sheetRef.current
    if (!handleEl || !sheetEl) return

    let localMove: ((ev: PointerEvent) => void) | null = null
    let localUp: ((ev: PointerEvent) => void) | null = null

    const onPointerDown = (e: PointerEvent) => {
      // only primary button or touch
      if (e instanceof PointerEvent && e.button && e.button !== 0) return
      // prevent page scrolling
      e.preventDefault()

      // stop any existing RAF animation
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      setTransition('none') // immediate response while dragging

      // start tracking
      const startY = e.clientY
      const rect = sheetEl.getBoundingClientRect()
      const startHeight = rect.height
      draggingRef.current = { startY, startHeight }
      lastPointerRef.current = { y: e.clientY, t: performance.now() }

      // capture pointer so move/up always arrive here
      try {
        ;(e.target as Element).setPointerCapture?.(e.pointerId)
      } catch (err) {
        // ignore
      }

      localMove = (ev: PointerEvent) => {
        if (!draggingRef.current) return
        lastPointerRef.current = { y: ev.clientY, t: performance.now() }
        const deltaY = ev.clientY - draggingRef.current.startY
        const newH = draggingRef.current.startHeight - deltaY
        setHeightPx(() => clampWithRubberband(newH))
      }

      localUp = (ev: PointerEvent) => {
        if (!draggingRef.current) return
        // compute velocity (px per ms)
        const last = lastPointerRef.current
        const now = performance.now()
        let velocity = 0
        if (last) {
          const dy = ev.clientY - last.y
          const dt = Math.max(1, now - last.t)
          velocity = dy / dt
        }

        const currentRect = sheetEl.getBoundingClientRect()
        const currentH = currentRect.height
        const H = vh()
        const projected = currentH + velocity * 200 // lookahead

        const closePxThreshold = Math.round(H * closeThreshold)
        const willCloseByPosition = projected <= closePxThreshold
        const willCloseByVelocity = velocity > 1.2

        if (willCloseByPosition || willCloseByVelocity) {
          // ensure clamp won't fight: clear dragging immediately
          draggingRef.current = null
          lastPointerRef.current = null
          setTransition(`height ${animationDurationMs}ms cubic-bezier(.22,.9,.32,1)`)
          setHeightPx(0)
          try {
            ;(ev.target as Element).releasePointerCapture?.(ev.pointerId)
          } catch (err) {}
          setTimeout(() => onClose?.(), animationDurationMs)
        } else {
          // snap
          const snapPx = nearestSnapPx(projected)
          draggingRef.current = null
          lastPointerRef.current = null
          setTransition(`height ${animationDurationMs}ms cubic-bezier(.22,.9,.32,1)`)
          setHeightPx(snapPx)
          try {
            ;(ev.target as Element).releasePointerCapture?.(ev.pointerId)
          } catch (err) {}
        }

        // cleanup
        if (localMove) document.removeEventListener('pointermove', localMove)
        if (localUp) {
          document.removeEventListener('pointerup', localUp)
          document.removeEventListener('pointercancel', localUp)
        }
      }

      document.addEventListener('pointermove', localMove!)
      document.addEventListener('pointerup', localUp!)
      document.addEventListener('pointercancel', localUp!)
    }

    handleEl.addEventListener('pointerdown', onPointerDown as any, { passive: false })

    return () => {
      // cleanup listener on handle
      handleEl.removeEventListener('pointerdown', onPointerDown as any)
      if (localMove) document.removeEventListener('pointermove', localMove)
      if (localUp) {
        document.removeEventListener('pointerup', localUp)
        document.removeEventListener('pointercancel', localUp)
      }
    }
  }, [clampWithRubberband, nearestSnapPx, animationDurationMs, closeThreshold, onClose, vh])

  // initialize to 0 height to avoid SSR flicker
  useEffect(() => {
    setTransition('none')
    setHeightPx(0)
    // set a tiny timeout so subsequent calls to open animate correctly
    const id = setTimeout(() => {
      setTransition(`height ${animationDurationMs}ms cubic-bezier(.22,.9,.32,1)`)
    }, 20)
    return () => clearTimeout(id)
  }, [animationDurationMs])

  return {
    // consumer uses these setters as refs: ref={setSheetRef} ref={setHandleRef}
    setSheetRef,
    setHandleRef,
    heightPx,
    transition,
    open,
    close,
    // expose raw setter for advanced tweaking if needed
    setHeightPx,
  }
}
