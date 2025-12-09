'use client'

import React, { useEffect, useRef, useState } from 'react'
import { X, MapPin, Clock, MessageCircle, ChevronUp, ChevronDown } from 'lucide-react'
import useGeneralStore, { ViewMode } from '@/store/generalStore'
import { cn } from '@/lib/utils'

export interface POI {
  id: string
  name: string
  type: string
  icon: string
  coordinates: [number, number]
  address?: string
  rating?: number
  priceLevel?: string
  hours?: string
  description?: string
}

interface POIDetailsSheetProps {
  poi: POI | null
  onClose: () => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  mapPeekHeight?: string
  onSendMessage?: (text: string) => void
}

const POIDetailsSheet: React.FC<POIDetailsSheetProps> = ({
  poi,
  onClose,
  viewMode,
  onViewModeChange,
  mapPeekHeight = '0px',
  onSendMessage,
}) => {
  const activeChatPOI = useGeneralStore((s) => s.activeChatPOI)
  const setActiveChatPOI = useGeneralStore((s) => s.setActiveChatPOI)
  const chatMessages = useGeneralStore((s) => s.chatMessages)
  const loading = useGeneralStore((s) => s.loading)

  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragStartMode, setDragStartMode] = useState<ViewMode>('map')
  const [chatInput, setChatInput] = useState('')

  const sheetRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isChattingWithPOI = activeChatPOI?.id === poi?.id
  const peekHeight = mapPeekHeight ?? '0px'
  const poiMessages = React.useMemo(
    () => chatMessages.filter((m) => m.context === 'poi' && m.poiId === poi?.id),
    [chatMessages, poi?.id]
  )

  const handleChatClick = () => {
    if (!poi) return

    if (isChattingWithPOI) {
      setActiveChatPOI(null)
      return
    }

    setActiveChatPOI(poi)
    onViewModeChange('poi-max')
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text) return
    onSendMessage?.(text)
    setChatInput('')
  }

  useEffect(() => {
    if (isChattingWithPOI) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [poiMessages.length, isChattingWithPOI])

  // Get transform styles based on view mode
  const getTransformStyle = () => {
    switch (viewMode) {
      case 'map':
        return 'translateY(100%)'
      case 'poi-min':
        return 'translateY(0%)'
      case 'poi-max':
        return 'translateY(0%)'
      default:
        return 'translateY(100%)'
    }
  }

  // Handle touch/pointer events for gestures
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return // Only handle primary button/touch

    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    setIsDragging(true)
    setDragStartY(e.clientY)
    setDragStartMode(viewMode)
    draggingRef.current = true
  }

  const handlePointerMove = (e: PointerEvent) => {
    if (!draggingRef.current) return

    const deltaY = e.clientY - dragStartY
    const threshold = 50 // Minimum drag distance to trigger mode change

    if (Math.abs(deltaY) < threshold) return

    if (deltaY < -threshold) {
      // Dragging up - maximize POI details
      if (dragStartMode === 'poi-min') {
        onViewModeChange('poi-max')
      }
    } else if (deltaY > threshold) {
      // Dragging down
      if (dragStartMode === 'poi-max') {
        onViewModeChange('poi-min')
      } else if (dragStartMode === 'poi-min') {
        onViewModeChange('map')
        onClose()
      }
    }
  }

  const handlePointerUp = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setIsDragging(false)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleGlobalPointerMove = (e: PointerEvent) => handlePointerMove(e)
    const handleGlobalPointerUp = () => handlePointerUp()

    window.addEventListener('pointermove', handleGlobalPointerMove)
    window.addEventListener('pointerup', handleGlobalPointerUp)
    window.addEventListener('pointercancel', handleGlobalPointerUp)

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove)
      window.removeEventListener('pointerup', handleGlobalPointerUp)
      window.removeEventListener('pointercancel', handleGlobalPointerUp)
    }
  }, [isDragging, dragStartY, dragStartMode, onViewModeChange])

  // Debug logging
  // console.log('POIDetailsSheet render:', { poi: poi?.name, viewMode })

  if (!poi) return null

  // Handle keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowUp' && viewMode === 'poi-min') {
      onViewModeChange('poi-max')
    } else if (e.key === 'ArrowDown') {
      if (viewMode === 'poi-max') {
        onViewModeChange('poi-min')
      } else if (viewMode === 'poi-min') {
        onClose()
      }
    }
  }

  return (
    <>
      {/* Backdrop - only visible when POI is maximized */}
      {viewMode === 'poi-max' && (
        <div
          className="fixed inset-x-0 top-0 bg-black/50 z-40 transition-opacity duration-200"
          style={{ bottom: peekHeight }}
          onClick={() => onViewModeChange('poi-min')}
        />
      )}

      {/* POI Details Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex flex-col bg-[var(--color-surface)] text-[var(--color-dark)] shadow-[0_-4px_24px_rgba(0,0,0,0.2)] will-change-transform',
          viewMode === 'poi-max' ? 'rounded-t-2xl' : 'rounded-2xl mx-4 mb-4'
        )}
        style={{
          height: viewMode === 'poi-max' ? `calc(100vh - ${peekHeight})` : viewMode === 'poi-min' ? '40vh' : '40vh',
          bottom: viewMode === 'poi-max' ? peekHeight : '0',
          transform: getTransformStyle(),
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          touchAction: 'none',
        }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Floating Close Button - sits on top edge like X.com */}
        {viewMode !== 'map' && (
          <button
            onClick={() => {
              onViewModeChange('map')
              onClose()
            }}
            className="absolute z-50 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-dark)] shadow-lg ring-1 ring-black/10 transition hover:bg-gray-100"
            style={{
              top: viewMode === 'poi-max' ? '-8px' : '-18px',
              right: viewMode === 'poi-max' ? '16px' : '12px',
            }}
            aria-label="Close POI details"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Drag Handle Area */}
        <div
          className={cn(
            'flex flex-col items-center gap-2 px-4 py-3 select-none cursor-grab active:cursor-grabbing border-b border-gray-100',
            viewMode === 'poi-max' ? 'sticky top-0 bg-[var(--color-surface)] z-10' : ''
          )}
          onPointerDown={handlePointerDown}
        >
          <div className="h-1 w-10 rounded-full bg-gray-300" />
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            {viewMode === 'poi-min' && <ChevronUp className="w-3 h-3" />}
            {viewMode === 'poi-max' && <ChevronDown className="w-3 h-3" />}
            <span>{viewMode === 'poi-min' ? 'Pull up for more' : 'Pull down to minimize'}</span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-2xl flex-shrink-0">
              {poi.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h2
                className={cn(
                  'font-semibold text-[var(--color-dark)] truncate',
                  viewMode === 'poi-max' ? 'text-xl' : 'text-lg'
                )}
              >
                {poi.name}
              </h2>
              <p className="text-sm text-[var(--color-gray)] truncate">{poi.type}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isChattingWithPOI ? (
            <div className="flex flex-col gap-3 py-4">
              <div className="flex items-center justify-between rounded-lg bg-[var(--color-primary-soft)] px-3 py-2">
                <div className="text-xs font-semibold text-[var(--color-primary-dark)]">Chatting with {poi.name}</div>
                <button
                  type="button"
                  className="text-xs font-medium text-[var(--color-primary-dark)] hover:underline"
                  onClick={() => setActiveChatPOI(null)}
                >
                  Back to details
                </button>
              </div>

              <div className="flex flex-col gap-3 overflow-y-auto">
                {poiMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                        message.role === 'user'
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-background-light)] text-[var(--color-dark)]'
                      )}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-2 text-xs text-[var(--color-gray)]">
                      Typing…
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          ) : (
            <div className="space-y-5 py-4">
              {/* Meta block */}
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-gray-50 px-3 py-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-dark)] shadow-sm">
                  <span className="text-lg leading-none">{poi.icon}</span>
                  <span className="truncate">{poi.type}</span>
                </span>
                {poi.rating && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-dark)] shadow-sm">
                    ⭐ {poi.rating}
                  </span>
                )}
                {poi.priceLevel && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-dark)] shadow-sm">
                    {poi.priceLevel}
                  </span>
                )}
              </div>

              {/* Address */}
              {poi.address && (
                <div className="flex items-start gap-3 rounded-xl border border-gray-100 px-3 py-3">
                  <MapPin className="h-5 w-5 text-[var(--color-gray)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-[var(--color-gray)] leading-relaxed">{poi.address}</p>
                  </div>
                </div>
              )}

              {/* Hours */}
              {poi.hours && (
                <div className="flex items-start gap-3 rounded-xl border border-gray-100 px-3 py-3">
                  <Clock className="h-5 w-5 text-[var(--color-gray)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-[var(--color-gray)]">{poi.hours}</p>
                  </div>
                </div>
              )}

              {/* Description */}
              {poi.description && (
                <div className="rounded-xl border border-gray-100 px-3 py-3">
                  <p className="text-[var(--color-gray)] leading-relaxed">{poi.description}</p>
                </div>
              )}

              {/* Extended content for maximized view */}
              {viewMode === 'poi-max' && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <h3 className="font-medium text-[var(--color-dark)] mb-2">More Information</h3>
                    <p className="text-sm text-[var(--color-gray)]">
                      Additional details, photos, reviews, and other information would appear here in the maximized
                      view.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons or Chat Composer - Sticky at bottom */}
        <div className="sticky bottom-0 bg-[var(--color-surface)] border-t border-gray-100 p-4">
          {isChattingWithPOI ? (
            <form onSubmit={handleChatSubmit} className="flex items-center gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Ask ${poi.name} anything...`}
                className="flex-1 rounded-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <button
                type="submit"
                className="rounded-full bg-[var(--color-primary)] py-3 px-4 font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                Send
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
              <button
                type="button"
                onClick={handleChatClick}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-full border px-4 py-3 font-medium transition-colors',
                  isChattingWithPOI
                    ? 'border-[var(--color-primary-dark)] bg-[var(--color-primary-dark)] text-white hover:bg-[var(--color-primary-darker)]'
                    : 'border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]'
                )}
              >
                <MessageCircle className="h-5 w-5" />
                {isChattingWithPOI ? 'Chatting' : 'Chat'}
              </button>
              <button
                type="button"
                className="rounded-full bg-[var(--color-primary)] py-3 px-4 font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                Get Directions
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default POIDetailsSheet
