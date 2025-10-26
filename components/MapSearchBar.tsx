'use client'

import { FormEvent, useEffect, useRef } from 'react'
import { Search, Send, X } from 'lucide-react'
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
  isChatActive?: boolean
}

export default function MapSearchBar({
  value,
  onChange,
  placeholder = 'Search places...',
  activeChatName,
  onClearChat,
  onSubmit,
  messages = [],
  isChatActive = false,
}: MapSearchBarProps) {
  const chatLabel = activeChatName ? `Chatting with ${activeChatName}` : null
  const hasMessages = isChatActive && messages.length > 0
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!hasMessages) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [hasMessages, messages.length])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    onSubmit?.(trimmedValue)
  }

  return (
    <div
      className={cn(
        'absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-full px-4 transition-all',
        chatLabel || hasMessages ? 'max-w-2xl' : 'max-w-md'
      )}
    >
      <div
        className={cn(
          'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 shadow-xl sm:px-5',
          hasMessages && 'flex h-[50vh] flex-col'
        )}
      >
        {hasMessages && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {messages.map((message) => (
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
            <div ref={messagesEndRef} />
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className={cn('flex items-center gap-3', hasMessages && 'mt-4')}
        >
          <Search className="h-5 w-5 flex-shrink-0 text-[var(--color-primary)]" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={chatLabel ? 'Ask this business anything…' : placeholder}
            className="flex-1 min-w-0 bg-transparent text-base text-[var(--color-dark)] placeholder:text-[var(--color-gray)] placeholder:opacity-70 focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:ring-offset-2 focus:ring-offset-white"
            aria-label="Send search"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
        {chatLabel && (
          <div
            className={cn(
              'mt-3 flex items-center gap-2 rounded-lg bg-[var(--color-primary-soft)] px-3 py-2',
              hasMessages && 'mt-4'
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
