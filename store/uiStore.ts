import { create } from "zustand";

type UIStore = {
  reducedMotion: boolean;
  performanceMode: "high" | "medium" | "low";
  isMobile: boolean;
  setReducedMotion: (v: boolean) => void;
  setPerformanceMode: (v: "high" | "medium" | "low") => void;
  setIsMobile: (v: boolean) => void;
};

export const useUIStore = create<UIStore>((set) => ({
  reducedMotion: false,
  performanceMode: "high",
  isMobile: false,
  setReducedMotion: (v) => set({ reducedMotion: v }),
  setPerformanceMode: (v) => set({ performanceMode: v }),
  setIsMobile: (v) => set({ isMobile: v }),
}));
