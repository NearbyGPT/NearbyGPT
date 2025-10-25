'use client'

import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MapSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  activeChatName?: string
  onClearChat?: () => void
}

export default function MapSearchBar({
  value,
  onChange,
  placeholder = 'Search places...',
  activeChatName,
  onClearChat,
}: MapSearchBarProps) {
  const chatLabel = activeChatName ? `Chatting with ${activeChatName}` : null

  return (
    <div
      className={cn(
        'absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-full px-4 transition-all',
        activeChatName ? 'max-w-2xl' : 'max-w-md'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 rounded-full bg-white shadow-xl border border-transparent px-5 transition-all',
          activeChatName ? 'py-4' : 'py-3.5'
        )}
      >
        <Search className="h-5 w-5 text-[#0066CC]" />
        {chatLabel && (
          <div className="flex items-center gap-2 rounded-full bg-[#E6F0FF] px-3 py-1 text-sm font-medium text-[#0052A3]">
            <span className="truncate max-w-[160px] sm:max-w-[220px]">{chatLabel}</span>
            <button
              type="button"
              onClick={onClearChat}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#0052A3]/70 transition hover:bg-[#0052A3]/10 hover:text-[#0052A3]"
              aria-label="Stop chatting with this business"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={chatLabel ? 'Ask this business anything…' : placeholder}
          className="flex-1 bg-transparent text-base text-gray-700 placeholder:text-gray-400 focus:outline-none"
        />
      </div>
    </div>
  )
}
