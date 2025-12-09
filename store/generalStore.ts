import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { POI } from '@/components/POICard'

export type ChatContext = 'map' | 'poi'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  context?: ChatContext
  poiId?: string
}

export type ViewMode = 'map' | 'poi-min' | 'poi-max'

interface GeneralState {
  flyToLocation?: (lng: number, lat: number) => void
  setFlyToLocation: (fn: (lng: number, lat: number) => void) => void
  selectedPOI: POI | null
  setSelectedPOI: (poi: POI | null) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  userLocation: { latitude: number; longitude: number } | null
  setUserLocation: (location: { latitude: number; longitude: number } | null) => void
  activeChatPOI: POI | null
  setActiveChatPOI: (poi: POI | null) => void
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  clearChatMessages: () => void
  loading: boolean
  setLoading: (value: boolean) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  isMapSearchMinimized: boolean
  setIsMapSearchMinimized: (minimized: boolean) => void
}

const useGeneralStore = create<GeneralState>()(
  persist(
    (set) => ({
      flyToLocation: undefined,
      setFlyToLocation: (fn) => set({ flyToLocation: fn }),
      selectedPOI: null,
      setSelectedPOI: (poi) => set({ selectedPOI: poi }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      userLocation: null,
      setUserLocation: (location) => set({ userLocation: location }),
      activeChatPOI: null,
      setActiveChatPOI: (poi) => set({ activeChatPOI: poi }),
      chatMessages: [],
      addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
      clearChatMessages: () => set({ chatMessages: [] }),
      loading: false,
      setLoading: (value) => set({ loading: value }),
      viewMode: 'map' as ViewMode,
      setViewMode: (mode) => set({ viewMode: mode }),
      isMapSearchMinimized: true,
      setIsMapSearchMinimized: (minimized) => set({ isMapSearchMinimized: minimized }),
    }),
    {
      name: 'general-store',
      partialize: (state) => ({
        chatMessages: state.chatMessages,
        activeChatPOI: state.activeChatPOI,
      }),
    }
  )
)

export default useGeneralStore
