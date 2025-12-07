'use client'

import { FormEvent, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Search, X, ArrowUpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/store/generalStore'
import useGeneralStore from '@/store/generalStore'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

interface MapSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  activeChatName?: string
  onClearChat?: () => void
  onSubmit?: (value: string) => void
  messages?: ChatMessage[]
  isExpanded?: boolean
  onExpand?: () => void
  onCollapseToMap?: () => void
}

type FilterToken = { id: string; label: string; icon: string }

const extractFiltersFromText = (text: string): FilterToken[] => {
  const tokens: FilterToken[] = []
  const lower = text.toLowerCase()

  const priceMatch = lower.match(/(\d{2,6})\s*-\s*(\d{2,6})\s*egp/)
  if (priceMatch) {
    tokens.push({
      id: `price-${priceMatch[1]}-${priceMatch[2]}`,
      label: `${priceMatch[1]}–${priceMatch[2]} EGP`,
      icon: '💰',
    })
  }

  if (lower.includes('pizza')) tokens.push({ id: 'pizza', label: 'Pizza', icon: '🍕' })
  if (lower.includes('sea food') || lower.includes('seafood'))
    tokens.push({ id: 'seafood', label: 'Seafood', icon: '🌊' })
  if (lower.includes('wood')) tokens.push({ id: 'wood-fired', label: 'Wood-fired', icon: '🔥' })
  if (lower.includes('coffee')) tokens.push({ id: 'coffee', label: 'Coffee', icon: '☕️' })
  if (lower.includes('breakfast')) tokens.push({ id: 'breakfast', label: 'Breakfast', icon: '🍳' })

  return tokens
}

export default function MapSearchBar({
  value,
  onChange,
  placeholder = 'Search places...',
  activeChatName,
  onClearChat,
  onSubmit,
  messages = [],
  onExpand,
  onCollapseToMap,
}: MapSearchBarProps) {
  const chatLabel = activeChatName ? `Chatting with ${activeChatName}` : null
  const hasMessages = messages.length > 0

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const loading = useGeneralStore((s) => s.loading)
  const messagesFromStorage = useGeneralStore((state) => state.chatMessages)
  const addChatMessage = useGeneralStore((state) => state.addChatMessage)

  // --- Constants ---
  const INPUT_BAR_HEIGHT = 60
  const MID_HEIGHT_RATIO = 0.6

  // --- State ---
  const [heightPx, setHeightPx] = useState<number>(0)
  const [isMinimized, setIsMinimized] = useState<boolean>(true)
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [bottomOffset, setBottomOffset] = useState(16)

  useEffect(() => {
    setBottomOffset(window.innerHeight * 0.02) // 2% of viewport height
  }, [])

  const draggingRef = useRef<{
    active: boolean
    startY: number
    startHeight: number
    committedHeight: number
  }>({ active: false, startY: 0, startHeight: 0, committedHeight: 0 })

  const setMinimized = useCallback(
    (value: boolean) => {
      setIsMinimized(value)
      if (value) {
        onCollapseToMap?.()
      }
    },
    [onCollapseToMap]
  )

  const showMessages = !isMinimized && hasMessages
  const lastUserTurns = useMemo(() => {
    const seen = new Set<string>()
    const uniqueTurns: ChatMessage[] = []
    messages
      .filter((m) => m.role === 'user')
      .reverse()
      .forEach((m) => {
        if (seen.has(m.text)) return
        seen.add(m.text)
        uniqueTurns.push(m)
      })
    return uniqueTurns.slice(0, 2).reverse()
  }, [messages])

  const derivedFilters = useMemo(() => {
    const latestUserText = messages.filter((m) => m.role === 'user').slice(-1)[0]?.text ?? ''
    return extractFiltersFromText(`${latestUserText} ${value}`)
  }, [messages, value])

  const suggestionPresets = useMemo(
    () => ['Add price range 100-300 EGP', 'Only wood-fired', 'Seafood pizza', 'Near me', 'Outdoor seating'],
    []
  )
  const suggestions = useMemo(() => {
    if (!value.trim()) return suggestionPresets.slice(0, 3)
    return suggestionPresets.filter((s) => s.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
  }, [suggestionPresets, value])

  const handleApplySuggestion = (text: string) => {
    const spacer = value.trim() ? ' ' : ''
    onChange(`${value}${spacer}${text}`)
  }

  const handleClearAll = () => {
    onChange('')
    onClearChat?.()
    setMinimized(true)
  }

  // --- Initialize height ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initial = Math.round(window.innerHeight * MID_HEIGHT_RATIO)
      setHeightPx(initial)
      draggingRef.current.committedHeight = initial
    }
  }, [])

  // --- Persist chat messages ---
  useEffect(() => {
    if (!messages.length && messagesFromStorage.length) {
      messagesFromStorage.forEach((msg) => addChatMessage(msg))
    }
  }, [])

  // --- Scroll to bottom ---
  useEffect(() => {
    if (!showMessages) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [showMessages, messages.length])

  // --- Helpers ---
  const clampPx = useCallback((px: number) => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 1000
    return Math.min(Math.max(px, INPUT_BAR_HEIGHT), vh)
  }, [])

  const applyDragTransform = useCallback((committedHeight: number, newHeight: number) => {
    const sheet = sheetRef.current
    if (!sheet) return
    const delta = committedHeight - newHeight
    sheet.style.transform = `translateY(${delta}px)`
    sheet.style.transition = 'none'
    sheet.style.willChange = 'transform'
  }, [])

  const clearDragTransform = useCallback(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    sheet.style.transform = 'translateY(0)'
    sheet.style.transition = ''
    sheet.style.willChange = ''
  }, [])

  // --- Drag handlers ---
  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button && e.button !== 0) return
      e.preventDefault()
      const startY = e.clientY
      const committedHeight = sheetRef.current ? sheetRef.current.getBoundingClientRect().height : heightPx
      draggingRef.current = { active: true, startY, startHeight: committedHeight, committedHeight }

      try {
        ;(e.target as Element).setPointerCapture?.(e.pointerId)
      } catch {}

      const onPointerMove = (ev: PointerEvent) => {
        if (!draggingRef.current.active) return
        const deltaY = ev.clientY - draggingRef.current.startY
        const newHeight = clampPx(draggingRef.current.startHeight - deltaY)
        applyDragTransform(draggingRef.current.committedHeight, newHeight)
      }

      const onPointerUp = (ev: PointerEvent) => {
        if (!draggingRef.current.active) return
        const vh = typeof window !== 'undefined' ? window.innerHeight : 1000
        const finalRawHeight = draggingRef.current.startHeight - (ev.clientY - draggingRef.current.startY)
        const clamped = clampPx(finalRawHeight)

        const snapPoints = [vh * 0.9, vh * MID_HEIGHT_RATIO, INPUT_BAR_HEIGHT]
        let best = snapPoints[0]
        let bestDiff = Math.abs(clamped - snapPoints[0])
        for (let i = 1; i < snapPoints.length; i++) {
          const d = Math.abs(clamped - snapPoints[i])
          if (d < bestDiff) {
            best = snapPoints[i]
            bestDiff = d
          }
        }

        draggingRef.current.committedHeight = Math.round(best)
        setHeightPx(Math.round(best))
        const willMinimize = best === INPUT_BAR_HEIGHT
        setMinimized(willMinimize)
        requestAnimationFrame(() => clearDragTransform())

        try {
          ;(ev.target as Element).releasePointerCapture?.(ev.pointerId)
        } catch {}
        draggingRef.current.active = false
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
        document.removeEventListener('pointercancel', onPointerUp)
      }

      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
      document.addEventListener('pointercancel', onPointerUp)
    },
    [applyDragTransform, clampPx, clearDragTransform, heightPx]
  )

  // --- Form submit ---
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedValue = value.trim()
    if (!trimmedValue) return
    onSubmit?.(trimmedValue)
    onChange('')
  }

  // --- Focus handler ---
  const handleFocus = () => {
    // If user focuses the search bar while a POI sheet is open, return to map context
    onCollapseToMap?.()
    const vh = window.innerHeight
    const midHeight = Math.round(vh * MID_HEIGHT_RATIO)
    draggingRef.current.committedHeight = midHeight
    setHeightPx(midHeight)
    setMinimized(false)
    onExpand?.()
  }

  // --- Close chat when clicking outside ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) {
        setMinimized(true)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[760px] z-20 pointer-events-auto">
        <div className="flex flex-col gap-2">
          {lastUserTurns.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--color-gray)]">
              <span className="uppercase tracking-wide text-[10px] text-gray-400">Recent</span>
              {lastUserTurns.map((m, idx) => (
                <span
                  key={`${m.id}-${idx}`}
                  className="rounded-full bg-white/90 px-3 py-1 shadow-sm border border-gray-100 text-[var(--color-dark)]"
                >
                  {m.text.length > 42 ? `${m.text.slice(0, 42)}…` : m.text}
                </span>
              ))}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 bg-white shadow-xl rounded-full px-4 py-2 border border-gray-100"
          >
            <Search className="h-5 w-5 flex-shrink-0 text-[var(--color-primary)]" />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={chatLabel ? 'Ask this business anything…' : 'Ask for places or filters…'}
              onFocus={handleFocus}
              className="flex-1 min-w-0 bg-transparent text-base text-[var(--color-dark)] placeholder:text-[var(--color-gray)] placeholder:opacity-70 focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
              aria-label="Send search"
            >
              <ArrowUpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>

          {derivedFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="uppercase tracking-wide text-[10px] text-gray-400">Filters</span>
              {derivedFilters.map((token) => (
                <span
                  key={token.id}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--color-background-light)] px-3 py-1 text-[var(--color-dark)] border border-gray-200"
                >
                  <span>{token.icon}</span>
                  <span>{token.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex items-end justify-center">
      <div
        ref={sheetRef}
        className="absolute bg-white shadow-xl rounded-2xl flex flex-col overflow-hidden pointer-events-auto"
        style={{
          top: `calc(100vh - ${heightPx}px - ${bottomOffset}px)`,
          height: `${heightPx}px`,
          width: 'min(100%, 700px)',
          minWidth: '50%',
          transition: draggingRef.current.active ? 'none' : 'transform 180ms ease, height 200ms ease',
          transform: 'translateY(0)',
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div
          className="w-full flex items-center justify-center py-2 cursor-grab"
          onPointerDown={onHandlePointerDown}
          role="button"
          aria-label="Resize panel"
          style={{ touchAction: 'none' }}
        >
          <div className="w-[40px] h-2 bg-gray-500 rounded-full" />
        </div>

        {/* Context and filters */}
        <div className="px-4 pb-2 space-y-2">
          {lastUserTurns.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--color-gray)]">
              <span className="uppercase tracking-wide text-[10px] text-gray-400">Recent</span>
              {lastUserTurns.map((m, idx) => (
                <span
                  key={`${m.id}-${idx}`}
                  className="rounded-full bg-[var(--color-background-light)] px-3 py-1 shadow-sm border border-gray-200 text-[var(--color-dark)]"
                >
                  {m.text.length > 42 ? `${m.text.slice(0, 42)}…` : m.text}
                </span>
              ))}
            </div>
          )}

          {derivedFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="uppercase tracking-wide text-[10px] text-gray-400">Filters</span>
              {derivedFilters.map((token) => (
                <span
                  key={token.id}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--color-background-light)] px-3 py-1 text-[var(--color-dark)] border border-gray-200"
                >
                  <span>{token.icon}</span>
                  <span>{token.label}</span>
                </span>
              ))}
              <button
                type="button"
                onClick={handleClearAll}
                className="ml-auto text-[10px] uppercase tracking-wide text-[var(--color-primary)] hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Chat content */}
        <div className="rounded-2xl px-4 py-4 sm:px-5 flex-1 flex flex-col h-full min-h-0">
          {showMessages && (
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 pb-2">
              {messages.map((message) => (
                <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm prose prose-sm',
                      message.role === 'user'
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-background-light)] text-[var(--color-dark)]'
                    )}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{message.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1 bg-gray-600 rounded-full px-3 py-2">
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '-0.3s' }}
                    />
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '-0.15s' }}
                    />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input bar */}
          <form onSubmit={handleSubmit} className="flex items-center gap-3 mt-4 relative">
            <Search className="h-5 w-5 flex-shrink-0 text-[var(--color-primary)]" />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={chatLabel ? 'Ask this business anything…' : placeholder}
              onFocus={handleFocus}
              className="flex-1 min-w-0 bg-transparent text-base text-[var(--color-dark)] placeholder:text-[var(--color-gray)] placeholder:opacity-70 focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
              aria-label="Send search"
            >
              <ArrowUpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </button>

            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-gray-100 bg-white shadow-lg p-2 space-y-1 z-10">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="w-full text-left text-sm text-[var(--color-dark)] px-3 py-2 rounded-xl hover:bg-[var(--color-background-light)]"
                    onClick={() => handleApplySuggestion(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </form>

          {chatLabel && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--color-primary-soft)] px-3 py-2">
              <span className="flex-1 text-sm font-medium leading-snug text-[var(--color-primary-dark)] break-words">
                {chatLabel}
              </span>
              {onClearChat && (
                <button
                  type="button"
                  onClick={onClearChat}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[var(--color-primary-dark)] opacity-70 transition-colors hover:bg-[var(--color-primary-soft)] hover:opacity-100"
                  aria-label="Stop chatting with this business"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
