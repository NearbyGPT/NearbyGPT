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
  const isChattingWithPOI = activeChatPOI?.id === poi.id

  const handleChatClick = () => {
    if (isChattingWithPOI) {
      setActiveChatPOI(null)
      return
    }

    setActiveChatPOI(poi)
    onClose()
  }

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#20B2AA] flex items-center justify-center text-2xl">
                {poi.icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{poi.name}</h3>
                <p className="text-sm text-gray-500">{poi.type}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {poi.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <MapPin className="h-4 w-4" />
              <span>{poi.address}</span>
            </div>
          )}

          {poi.rating && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">⭐ {poi.rating}</span>
              {poi.priceLevel && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-600">{poi.priceLevel}</span>
                </>
              )}
            </div>
          )}

          {poi.hours && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Clock className="h-4 w-4" />
              <span>{poi.hours}</span>
            </div>
          )}

          {poi.description && (
            <p className="text-sm text-gray-600 mt-3 pt-3 border-t">{poi.description}</p>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleChatClick}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-full border px-4 py-3 font-medium transition-colors',
                isChattingWithPOI
                  ? 'border-[#0052A3] bg-[#0052A3] text-white hover:bg-[#004482]'
                  : 'border-[#0066CC] text-[#0066CC] hover:bg-[#E6F0FF]'
              )}
            >
              <MessageCircle className="h-5 w-5" />
              {isChattingWithPOI ? 'Chatting' : 'Chat'}
            </button>
            <button
              type="button"
              className="w-full rounded-full bg-[#0066CC] py-3 font-medium text-white transition-colors hover:bg-[#0052A3]"
            >
              Get Directions
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
