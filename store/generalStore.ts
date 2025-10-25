import { create } from "zustand";
import { persist } from "zustand/middleware";
import { POI } from "@/components/POICard";

interface GeneralState {
  flyToLocation?: (lng: number, lat: number) => void;
  setFlyToLocation: (fn: (lng: number, lat: number) => void) => void;
  selectedPOI: POI | null;
  setSelectedPOI: (poi: POI | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userLocation: { latitude: number; longitude: number } | null;
  setUserLocation: (location: { latitude: number; longitude: number } | null) => void;
}

const useGeneralStore = create<GeneralState>()(
  persist(
    (set) => ({
      flyToLocation: undefined,
      setFlyToLocation: (fn) => set({ flyToLocation: fn }),
      selectedPOI: null,
      setSelectedPOI: (poi) => set({ selectedPOI: poi }),
      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),
      userLocation: null,
      setUserLocation: (location) => set({ userLocation: location }),
    }),
    {
      name: "general-store",
      partialize: (state) => ({}),
    }
  )
);

export default useGeneralStore;
