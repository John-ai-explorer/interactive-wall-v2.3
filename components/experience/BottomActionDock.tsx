"use client";

import type { PointerEvent } from "react";

type ActionMode = "explore" | "story" | "listen" | "question";

type Props = {
  activeMode: ActionMode;
  canComplete: boolean;
  onModeChange: (mode: ActionMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onComplete: () => void;
};

const ACTIONS: { mode: ActionMode; label: string; icon: string }[] = [
  { mode: "explore", label: "漫游", icon: "⌖" },
  { mode: "story", label: "故事", icon: "≡" },
  { mode: "listen", label: "聆听", icon: "♪" },
  { mode: "question", label: "问答", icon: "?" },
];

export default function BottomActionDock({
  activeMode,
  canComplete,
  onModeChange,
  onPrev,
  onNext,
  onComplete,
}: Props) {
  const stopGesture = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      data-no-swipe
      className="absolute inset-x-0 bottom-0 z-30 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6"
      onPointerDown={stopGesture}
      onPointerUp={stopGesture}
      onPointerMove={stopGesture}
    >
      <div className="mx-auto max-w-[58rem] rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(8,14,26,0.76)] p-2 backdrop-blur-md">
        <div className="grid grid-cols-4 gap-1">
          {ACTIONS.map((item) => (
            <button
              key={item.mode}
              type="button"
              onClick={() => onModeChange(item.mode)}
              className={`min-h-14 rounded-xl text-xs transition-colors ${
                activeMode === item.mode
                  ? "bg-[rgba(214,168,79,0.16)] text-[#F7F2E8]"
                  : "text-[#B9B1A2] hover:bg-white/5"
              }`}
            >
              <span className="block text-lg leading-none">{item.icon}</span>
              <span className="mt-1 block">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <button type="button" onClick={onPrev} className="btn-outline min-h-10 rounded-xl text-sm">
            上一章
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="min-h-10 rounded-xl border border-[rgba(214,168,79,0.2)] bg-white/5 text-sm text-[#D6A84F] disabled:opacity-45"
            disabled={!canComplete}
          >
            留印
          </button>
          <button type="button" onClick={onNext} className="btn-primary min-h-10 rounded-xl text-sm">
            下一章
          </button>
        </div>
      </div>
    </div>
  );
}
