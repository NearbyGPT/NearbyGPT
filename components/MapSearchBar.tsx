'use client'

import { FormEvent, useEffect, useRef, useState, useCallback } from 'react'
import { Search, X, ArrowUpCircle, Plus } from 'lucide-react'
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
  onSubmit?: (value: string, imageFile?: File) => void // Updated to accept image file
  messages?: ChatMessage[]
  isExpanded?: boolean
  onExpand?: () => void
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
}: MapSearchBarProps) {
  const chatLabel = activeChatName ? `Chatting with ${activeChatName}` : null
  const hasMessages = messages.length > 0

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const loading = useGeneralStore((s) => s.loading)
  const messagesFromStorage = useGeneralStore((state) => state.chatMessages)
  const addChatMessage = useGeneralStore((state) => state.addChatMessage)
  const activeChatPOI = useGeneralStore((s) => s.activeChatPOI)
  const isMapSearchMinimized = useGeneralStore((s) => s.isMapSearchMinimized)
  const setIsMapSearchMinimized = useGeneralStore((s) => s.setIsMapSearchMinimized)

  // --- Constants ---
  const INPUT_BAR_HEIGHT = 60
  const MID_HEIGHT_RATIO = 0.6

  // --- State ---
  const [heightPx, setHeightPx] = useState<number>(0)
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [bottomOffset, setBottomOffset] = useState(16)

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)

  useEffect(() => {
    setBottomOffset(window.innerHeight * 0.02) // 2% of viewport height
  }, [])

  const draggingRef = useRef<{
    active: boolean
    startY: number
    startHeight: number
    committedHeight: number
  }>({ active: false, startY: 0, startHeight: 0, committedHeight: 0 })

  const showMessages = !isMapSearchMinimized && hasMessages

  // --- Image Upload Functions ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError('Image size should be less than 5MB')
      return
    }

    setSelectedImage(file)
    setImageUploadError(null)

    // Create preview
    const url = URL.createObjectURL(file)
    // Revoke previous if any
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(url)

    // Reset input value
    e.currentTarget.value = ''
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setImageUploadError(null)
  }

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

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
        setIsMapSearchMinimized(best === INPUT_BAR_HEIGHT)
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
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedValue = value.trim()

    // If there's no text and no image, do nothing
    if (!trimmedValue && !selectedImage) return

    // Call the onSubmit handler with both text and image file
    onSubmit?.(trimmedValue, selectedImage || undefined)

    // Clear the input and image state
    onChange('')
    handleRemoveImage()
  }

  // --- Focus handler ---
  const handleFocus = () => {
    const vh = window.innerHeight
    const midHeight = Math.round(vh * MID_HEIGHT_RATIO)
    draggingRef.current.committedHeight = midHeight
    setHeightPx(midHeight)
    setIsMapSearchMinimized(false)
    onExpand?.()
  }

  // --- Close chat when clicking outside ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) {
        setIsMapSearchMinimized(true)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (isMapSearchMinimized) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[700px] z-20 pointer-events-auto">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 bg-white shadow-xl rounded-full px-4 py-2">
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
            disabled={!value.trim() && !selectedImage}
          >
            <ArrowUpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
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
          width: 'min(90%, 700px)',
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

        {/* Image preview and upload error */}
        {(previewUrl || imageUploadError) && (
          <div className="px-4 pb-2 pt-2">
            {previewUrl && (
              <div className="mb-2 flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <div className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="selected preview" className="object-cover w-full h-full" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-600 truncate">{selectedImage?.name}</div>
                  <div className="text-xs text-gray-500">
                    {(selectedImage?.size || 0) / 1024 / 1024 < 1
                      ? `${((selectedImage?.size || 0) / 1024).toFixed(1)} KB`
                      : `${((selectedImage?.size || 0) / 1024 / 1024).toFixed(1)} MB`}
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs underline text-gray-700 hover:text-red-600"
                  onClick={handleRemoveImage}
                  disabled={loading}
                >
                  Remove
                </button>
              </div>
            )}

            {imageUploadError && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-xs text-red-600">{imageUploadError}</div>
              </div>
            )}
          </div>
        )}

        {/* Chat content */}
        <div className="rounded-2xl px-4 py-4 sm:px-5 flex-1 flex flex-col justify-end h-full">
          {showMessages && (
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
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
          <form onSubmit={handleSubmit} className="flex items-center gap-3 mt-4">
            <Search className="h-5 w-5 flex-shrink-0 text-[var(--color-primary)]" />

            {/* Hidden file input for image upload */}
            <input
              id="mapsearch-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Image upload button - only show when chatting with a business */}
            {activeChatPOI?.id && (
              <button
                type="button"
                onClick={() => document.getElementById('mapsearch-image-input')?.click()}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                disabled={loading}
                aria-label="Upload image"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}

            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={chatLabel ? 'Ask this business anything…' : placeholder}
              onFocus={handleFocus}
              className="flex-1 min-w-0 bg-transparent text-base text-[var(--color-dark)] placeholder:text-[var(--color-gray)] placeholder:opacity-70 focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send search"
              disabled={(!value.trim() && !selectedImage) || loading}
            >
              <ArrowUpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
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
