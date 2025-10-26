'use client'

import { X, MapPin, Clock, MessageCircle } from 'lucide-react'
import useGeneralStore from '@/store/generalStore'
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

interface POICardProps {
  poi: POI
  onClose: () => void
}

export default function POICard({ poi, onClose }: POICardProps) {
  const activeChatPOI = useGeneralStore((s) => s.activeChatPOI)
  const setActiveChatPOI = useGeneralStore((s) => s.setActiveChatPOI)
  const clearChatMessages = useGeneralStore((s) => s.clearChatMessages)
  const isChattingWithPOI = activeChatPOI?.id === poi.id

  const handleChatClick = () => {
    if (isChattingWithPOI) {
      setActiveChatPOI(null)
      clearChatMessages()
      return
    }

    clearChatMessages()
    setActiveChatPOI(poi)
    onClose()
  }

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-4">
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-2xl">
                {poi.icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{poi.name}</h3>
                <p className="text-sm text-[var(--color-gray)]">{poi.type}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[var(--color-background-light)] rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-[var(--color-gray)] opacity-70" />
            </button>
          </div>

          {poi.address && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-gray)] mb-2">
              <MapPin className="h-4 w-4" />
              <span>{poi.address}</span>
            </div>
          )}

          {poi.rating && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">⭐ {poi.rating}</span>
              {poi.priceLevel && (
                <>
                  <span className="text-[var(--color-gray)] opacity-50">•</span>
                  <span className="text-sm text-[var(--color-gray)]">{poi.priceLevel}</span>
                </>
              )}
            </div>
          )}

          {poi.hours && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-gray)] mb-2">
              <Clock className="h-4 w-4" />
              <span>{poi.hours}</span>
            </div>
          )}

          {poi.description && (
            <p className="text-sm text-[var(--color-gray)] mt-3 pt-3 border-t">{poi.description}</p>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleChatClick}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-full border px-4 py-3 font-medium transition-colors',
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
              className="w-full rounded-full bg-[var(--color-primary)] py-3 font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
            >
              Get Directions
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
