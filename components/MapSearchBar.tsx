'use client'

import { FormEvent, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { X, ArrowUp, Plus, FileText, MessageSquarePlus } from 'lucide-react'
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
  onNewConversation?: () => void
  onSubmit?: (value: string, file?: File) => void // Updated to accept any file
  messages?: ChatMessage[]
  isExpanded?: boolean
  onExpand?: () => void
}

export default function MapSearchBar({
  value,
  onChange,
  placeholder = 'Ask to filter map...',
  activeChatName,
  onClearChat,
  onNewConversation,
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

  // File upload state (now supports both images and PDFs)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileUploadError, setFileUploadError] = useState<string | null>(null)

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
  const remarkPlugins = useMemo(() => [remarkGfm, remarkBreaks], [])

  // --- File Upload Functions ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return

    // Validate file type
    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf'

    if (!isImage && !isPDF) {
      setFileUploadError('Please select an image or PDF file')
      return
    }

    // Validate file size (5MB limit for both)
    if (file.size > 5 * 1024 * 1024) {
      setFileUploadError('File size should be less than 5MB')
      return
    }

    setSelectedFile(file)
    setFileUploadError(null)

    // Create preview for images only
    if (isImage) {
      const url = URL.createObjectURL(file)
      // Revoke previous if any
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(url)
    } else {
      // For PDFs, clear any previous image preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    }

    // Reset input value
    e.currentTarget.value = ''
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setFileUploadError(null)
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

  const renderedMessages = useMemo(() => {
    if (!showMessages) return null

    return (
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 w-full"
        style={{ maskImage: 'linear-gradient(to bottom, transparent, black 6%, black 94%, transparent)' }}
      >
        {messages.map((message) => (
          <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[86%] rounded-[22px] px-4 py-3 text-sm shadow-sm prose prose-sm',
                message.role === 'user'
                  ? 'bg-gradient-to-br from-[#3f7cff] via-[#3f7cff] to-[#6aa8ff] text-white shadow-[0_10px_30px_rgba(63,124,255,0.35)]'
                  : 'bg-[#f5f5f7] text-[var(--color-dark)] border border-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.08)]'
              )}
            >
              <ReactMarkdown remarkPlugins={remarkPlugins}>{message.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 bg-gray-600 rounded-full px-3 py-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    )
  }, [messages, loading, remarkPlugins, showMessages])

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

    // If there's no text and no file, do nothing
    if (!trimmedValue && !selectedFile) return

    // Call the onSubmit handler with both text and file
    onSubmit?.(trimmedValue, selectedFile || undefined)

    // Clear the input and file state
    onChange('')
    handleRemoveFile()
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
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[720px] z-20 pointer-events-auto">
        <form
          onSubmit={handleSubmit}
          className="flex w-full items-center gap-2 bg-white/90 backdrop-blur-xl shadow-[0_14px_50px_rgba(0,0,0,0.18)] border border-white/70 rounded-full px-3 py-2"
        >
          <input
            id="mapsearch-image-input"
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => document.getElementById('mapsearch-image-input')?.click()}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#f1f2f6] text-gray-600 shadow-[0_6px_16px_rgba(0,0,0,0.08)] hover:bg-[#e8e9ed] transition-colors"
            aria-label="Attach"
            disabled={loading}
          >
            <Plus className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={chatLabel ? 'Ask this business anything…' : placeholder}
            onFocus={handleFocus}
            className="flex-1 min-w-0 h-11 bg-[#f7f7fa] text-base leading-[1.2] text-[var(--color-dark)] placeholder:text-[var(--color-gray)] placeholder:opacity-80 focus:outline-none rounded-full px-4 shadow-inner"
          />
          <button
            type="submit"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white shadow-[0_10px_24px_rgba(0,0,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
            aria-label="Send search"
            disabled={!value.trim() && !selectedFile}
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex items-end justify-center">
      <div
        ref={sheetRef}
        className="absolute bg-white/95 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.25)] border border-white/70 rounded-[16px] flex flex-col overflow-hidden pointer-events-auto"
        style={{
          top: `calc(100vh - ${heightPx}px - ${bottomOffset}px)`,
          height: `${heightPx}px`,
          width: 'min(99%, 700px)',
          minWidth: '50%',
          transition: draggingRef.current.active ? 'none' : 'transform 180ms ease, height 200ms ease',
          transform: 'translateY(0)',
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div
          className="w-full flex items-center justify-center py-3 cursor-grab"
          onPointerDown={onHandlePointerDown}
          role="button"
          aria-label="Resize panel"
          style={{ touchAction: 'none' }}
        >
          <div className="w-[50px] h-2 bg-gray-300 rounded-full" />
        </div>

        {/* File preview and upload error */}
        {(selectedFile || fileUploadError) && (
          <div className="px-4 pb-2 pt-2">
            {selectedFile && (
              <div className="mb-2 flex items-center gap-2 p-3 bg-[#f5f6fa] rounded-2xl border border-white/70 shadow-inner">
                <div className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-300 flex items-center justify-center bg-gray-100">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="selected preview" className="object-cover w-full h-full" />
                  ) : selectedFile.type === 'application/pdf' ? (
                    <div className="flex flex-col items-center justify-center p-2">
                      <FileText className="h-8 w-8 text-red-500" />
                      <span className="text-xs text-gray-600 mt-1">PDF</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-2">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-600 truncate">{selectedFile.name}</div>
                  <div className="text-xs text-gray-500">
                    {selectedFile.size / 1024 / 1024 < 1
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                      : `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`}
                    {selectedFile.type === 'application/pdf' && ' • PDF'}
                    {selectedFile.type.startsWith('image/') && ' • Image'}
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs underline text-gray-700 hover:text-red-600"
                  onClick={handleRemoveFile}
                  disabled={loading}
                >
                  Remove
                </button>
              </div>
            )}

            {fileUploadError && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-xs text-red-600">{fileUploadError}</div>
              </div>
            )}
          </div>
        )}

        {/* Chat content */}
        <div className="rounded-3xl px-5 py-4 sm:px-6 flex-1 flex flex-col justify-end gap-5 h-full bg-gradient-to-b from-white/95 via-white to-[#f2f3f6] pb-8">
          {/* New Conversation Button - only show when there are messages */}
          {hasMessages && onNewConversation && (
            <div className="flex justify-center mb-4">
              <button
                type="button"
                onClick={onNewConversation}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-primary)] bg-[var(--color-primary-soft)] hover:bg-[var(--color-primary-soft)]/80 rounded-full transition-colors shadow-sm"
                disabled={loading}
              >
                <MessageSquarePlus className="h-4 w-4" />
                <span>New Conversation</span>
              </button>
            </div>
          )}

          {renderedMessages}

          {/* Input bar */}
          <form onSubmit={handleSubmit} className="flex w-full items-center gap-3 mt-5">
            <button
              type="button"
              onClick={() => document.getElementById('mapsearch-image-input')?.click()}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#f1f2f6] text-gray-700 shadow-[0_8px_22px_rgba(0,0,0,0.1)] hover:bg-[#e8e9ed] transition-colors"
              aria-label="Attach"
              disabled={loading}
            >
              <Plus className="h-5 w-5" />
            </button>

            {/* Hidden file input for file upload (images and PDFs) */}
            <input
              id="mapsearch-image-input"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex-1 flex items-center rounded-full bg-[#f7f7fa] px-4 py-2.5 shadow-inner border border-white/60">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={chatLabel ? 'Ask this business anything…' : placeholder}
                onFocus={handleFocus}
                className="flex-1 min-w-0 h-11 bg-transparent text-base leading-[1.2] text-[var(--color-dark)] placeholder:text-[var(--color-gray)] placeholder:opacity-80 focus:outline-none"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white shadow-[0_14px_32px_rgba(0,0,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
              aria-label="Send search"
              disabled={(!value.trim() && !selectedFile) || loading}
            >
              <ArrowUp className="h-5 w-5" />
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
