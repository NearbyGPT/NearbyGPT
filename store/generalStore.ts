/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GeneralState {
  flyToLocation?: (lng: number, lat: number) => void
  setFlyToLocation: (fn: (lng: number, lat: number) => void) => void

  filteredRestaurants?: GeoJSON.FeatureCollection
  setFilteredRestaurants: (data: GeoJSON.FeatureCollection | null) => void

  selectedRestaurant?: any
  setSelectedRestaurant: (data: any) => void

  isPanelOpen: boolean
  setPanelOpen: (v: boolean) => void
}

const useGeneralStore = create<GeneralState>()(
  persist(
    (set) => ({
      flyToLocation: undefined,
      setFlyToLocation: (fn) => set({ flyToLocation: fn }),

      filteredRestaurants: undefined,
      setFilteredRestaurants: (data) => set({ filteredRestaurants: data ?? undefined }),

      isPanelOpen: false,
      setSelectedRestaurant: (data) => set({ selectedRestaurant: data }),
      setPanelOpen: (v) => set({ isPanelOpen: v }),
    }),

    {
      name: 'general-store',
      partialize: () => ({}),
    }
  )
)

export default useGeneralStore
