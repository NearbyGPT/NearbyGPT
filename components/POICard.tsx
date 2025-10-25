'use client'

import { X, MapPin, Clock, DollarSign } from 'lucide-react'

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
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#3a761e] flex items-center justify-center text-2xl">
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

          <button className="w-full mt-4 bg-[#3a761e] text-white py-3 rounded-full font-medium hover:bg-[#2d5b17] transition-colors">
            Get Directions
          </button>
        </div>
      </div>
    </div>
  )
}
