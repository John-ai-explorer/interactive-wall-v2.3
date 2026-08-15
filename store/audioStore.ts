import { create } from "zustand";

type AudioStore = {
  bgmEnabled: boolean;
  narrationPlaying: boolean;
  currentAudio: string | null;
  toggleBgm: () => void;
  playNarration: (url: string) => void;
  stopNarration: () => void;
};

export const useAudioStore = create<AudioStore>((set) => ({
  bgmEnabled: false,
  narrationPlaying: false,
  currentAudio: null,
  toggleBgm: () => set((s) => ({ bgmEnabled: !s.bgmEnabled })),
  playNarration: (url) => set({ narrationPlaying: true, currentAudio: url }),
  stopNarration: () => set({ narrationPlaying: false, currentAudio: null }),
}));
