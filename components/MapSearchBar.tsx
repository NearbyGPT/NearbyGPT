'use client'

import { FormEvent, useEffect, useRef } from 'react'
import { Search, X, ArrowUpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/store/generalStore'

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
}

export default function MapSearchBar({
  value,
  onChange,
  placeholder = 'Search places...',
  activeChatName,
  onClearChat,
  onSubmit,
  messages = [],
  isExpanded = true,
  onExpand,
}: MapSearchBarProps) {
  const chatLabel = activeChatName ? `Chatting with ${activeChatName}` : null
  const hasMessages = messages.length > 0
  const showMessages = hasMessages && isExpanded
  const lastMessage = hasMessages ? messages[messages.length - 1] : null
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!showMessages) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [showMessages, messages.length])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    onSubmit?.(trimmedValue)
  }

  const handleFocus = () => {
    onExpand?.()
  }

  return (
    <div
      className={cn(
        'absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-full px-4 transition-all',
        chatLabel || showMessages ? 'max-w-2xl' : 'max-w-lg'
      )}
    >
      <div
        className={cn(
          'rounded-2xl bg-white shadow-2xl border border-transparent px-4 py-4 sm:px-5',
          showMessages && 'flex h-[50vh] flex-col'
        )}
      >
        {hasMessages && !showMessages && (
          <button
            type="button"
            onClick={onExpand}
            className="mb-3 w-full rounded-xl border border-[var(--color-primary-soft)] bg-[var(--color-background-light)] px-4 py-2 text-left shadow-sm transition-colors hover:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:ring-offset-2 focus:ring-offset-white"
            aria-label="Expand chat history"
          >
            <p className="text-sm font-semibold text-[var(--color-primary-dark)]">Chat hidden</p>
            {lastMessage && (
              <p className="mt-1 line-clamp-1 text-xs text-[var(--color-dark)] opacity-70">
                {lastMessage.role === 'assistant' ? 'AI: ' : 'You: '}
                {lastMessage.text}
              </p>
            )}
          </button>
        )}
        {showMessages && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {messages.map((message) => (
              <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
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
            <div ref={messagesEndRef} />
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className={cn('flex items-center gap-3', showMessages ? 'mt-4' : hasMessages ? 'mt-2' : undefined)}
        >
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
            className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:ring-offset-2 focus:ring-offset-white"
            aria-label="Send search"
          >
            <ArrowUpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
        {chatLabel && (
          <div
            className={cn(
              'mt-3 flex items-center gap-2 rounded-lg bg-[var(--color-primary-soft)] px-3 py-2',
              showMessages && 'mt-4'
            )}
          >
            <span className="flex-1 text-sm font-medium leading-snug text-[var(--color-primary-dark)] break-words">
              {chatLabel}
            </span>
            {onClearChat && (
              <button
                type="button"
                onClick={onClearChat}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[var(--color-primary-dark)] opacity-70 transition-colors hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-dark)] hover:opacity-100"
                aria-label="Stop chatting with this business"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
