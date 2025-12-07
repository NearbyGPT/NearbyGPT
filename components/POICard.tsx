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
    <div className="fixed inset-0 z-30 flex flex-col justify-end pointer-events-none">
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60 backdrop-blur-md pointer-events-auto"
        onClick={onClose}
      />

      <div className="relative pointer-events-auto">
        <div className="mx-auto w-full max-w-2xl px-4 pb-8">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/75 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            <div className="relative h-52 bg-gradient-to-br from-indigo-500 via-blue-500 to-sky-400 text-white">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.5),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.4),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.3),transparent_35%)]" />

              <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide shadow-lg shadow-black/20">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-base">{poi.icon}</span>
                <span className="hidden sm:inline">Nearby GPT</span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-end gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl shadow-lg shadow-black/25">
                    {poi.icon}
                  </div>
                  <div className="flex-1 text-white drop-shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/80">Places for you</p>
                    <h3 className="text-2xl font-semibold leading-tight">{poi.name}</h3>
                    <p className="text-sm text-white/80">{poi.type}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white transition hover:bg-white/35"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5 text-[var(--color-dark)]">
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-gray)]">
                {poi.address && (
                  <div className="flex items-center gap-2 rounded-full bg-[var(--color-background-light)] px-3 py-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium text-[var(--color-dark)]">{poi.address}</span>
                  </div>
                )}
                {poi.hours && (
                  <div className="flex items-center gap-2 rounded-full bg-[var(--color-background-light)] px-3 py-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium text-[var(--color-dark)]">{poi.hours}</span>
                  </div>
                )}
                {poi.rating && (
                  <div className="flex items-center gap-2 rounded-full bg-[var(--color-background-light)] px-3 py-2">
                    <span className="text-base">⭐</span>
                    <span className="font-medium text-[var(--color-dark)]">{poi.rating}</span>
                    {poi.priceLevel && <span className="text-[var(--color-gray)]">{poi.priceLevel}</span>}
                  </div>
                )}
              </div>

              {poi.description && (
                <p className="text-sm leading-relaxed text-[var(--color-gray)]">{poi.description}</p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleChatClick}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-base font-semibold transition-colors',
                    isChattingWithPOI
                      ? 'bg-[var(--color-primary-dark)] text-white shadow-lg shadow-[var(--color-primary-dark)]/30 hover:bg-[var(--color-primary-darker)]'
                      : 'border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]'
                  )}
                >
                  <MessageCircle className="h-5 w-5" />
                  {isChattingWithPOI ? 'Chatting' : 'Chat about this place'}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-dark)] px-5 py-3 text-base font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-black"
                >
                  Get Directions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
