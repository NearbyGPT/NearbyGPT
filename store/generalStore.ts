import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GeneralState {
  flyToLocation?: (lng: number, lat: number) => void;
  setFlyToLocation: (fn: (lng: number, lat: number) => void) => void;
}

const useGeneralStore = create<GeneralState>()(
  persist(
    (set) => ({
      flyToLocation: undefined,
      setFlyToLocation: (fn) => set({ flyToLocation: fn }),
    }),
    {
      name: "general-store",
      partialize: (state) => ({}),
    }
  )
);

export default useGeneralStore;
