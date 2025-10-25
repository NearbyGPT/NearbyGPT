'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface MapSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function MapSearchBar({ value, onChange, placeholder = 'Search places...' }: MapSearchBarProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-4 py-6 bg-white shadow-lg border-0 rounded-full text-base focus-visible:ring-2 focus-visible:ring-[#0066CC]"
        />
      </div>
    </div>
  )
}
