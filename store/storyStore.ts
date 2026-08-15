import { create } from "zustand";

type StoryStore = {
  progress: number;
  currentNodeId: string;
  direction: "forward" | "backward";
  isTransitioning: boolean;
  setProgress: (progress: number) => void;
  setCurrentNodeId: (id: string) => void;
  setDirection: (dir: "forward" | "backward") => void;
  setIsTransitioning: (v: boolean) => void;
};

export const useStoryStore = create<StoryStore>((set) => ({
  progress: 0,
  currentNodeId: "node_01",
  direction: "forward",
  isTransitioning: false,
  setProgress: (progress) => set({ progress }),
  setCurrentNodeId: (id) => set({ currentNodeId: id }),
  setDirection: (dir) => set({ direction: dir }),
  setIsTransitioning: (v) => set({ isTransitioning: v }),
}));
