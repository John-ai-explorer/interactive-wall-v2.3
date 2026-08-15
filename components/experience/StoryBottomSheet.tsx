"use client";

import type { PointerEvent } from "react";
import { getHotspotAnchor } from "@/components/experience/scene/hotspotAnchors";
import type { StoryChapter } from "@/lib/types";

type Props = {
  chapter: StoryChapter;
  chapterIndex: number;
  open: boolean;
  narrationPlaying: boolean;
  onClose: () => void;
  onPlayVideo: () => void;
  onToggleNarration: () => void;
};

export default function StoryBottomSheet({
  chapter,
  chapterIndex,
  open,
  narrationPlaying,
  onClose,
  onPlayVideo,
  onToggleNarration,
}: Props) {
  if (!open) return null;

  const anchor = getHotspotAnchor(chapterIndex);
  const stopGesture = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      data-no-swipe
      className="absolute z-40 animate__animated animate__fadeIn rounded-2xl border border-[rgba(214,168,79,0.26)] bg-[rgba(8,14,26,0.94)] shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl"
      style={{
        width: "min(28rem, calc(100vw - 1.5rem))",
        left: `clamp(0.75rem, calc(${anchor.left}% - min(14rem, calc((100vw - 1.5rem) / 2))), calc(100% - min(28rem, calc(100vw - 1.5rem)) - 0.75rem))`,
        top: `calc(${anchor.top}% + 2.75rem)`,
      }}
      onPointerDown={stopGesture}
      onPointerUp={stopGesture}
      onPointerMove={stopGesture}
    >
      <div
        className="overflow-y-auto p-5 pb-6 md:p-6"
        style={{
          maxHeight: `min(24rem, calc(100dvh - ${anchor.top}dvh - 10rem - env(safe-area-inset-bottom)))`,
        }}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1.5 text-sm font-medium text-[#D6A84F] md:text-base">
              {String(chapter.order).padStart(2, "0")} / 05
            </p>
            <h2 className="text-2xl font-bold leading-tight text-[#F7F2E8] md:text-[1.7rem]">
              {chapter.title}
            </h2>
            {chapter.subtitle && (
              <p className="mt-1.5 text-sm text-[#B9B1A2] md:text-base">{chapter.subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 shrink-0 rounded-full bg-white/5 text-xl text-[#B9B1A2]"
            aria-label="关闭故事"
          >
            ×
          </button>
        </div>

        <img
          src={chapter.image}
          alt={chapter.title}
          className="mb-4 aspect-video max-h-36 w-full rounded-xl object-cover md:max-h-40"
        />
        <p className="mb-5 text-base leading-7 text-[#D9D0C1] md:text-lg md:leading-8">{chapter.body}</p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onPlayVideo}
            className="btn-primary min-h-11 rounded-xl text-sm font-medium md:text-base"
          >
            观看短片
          </button>
          <button
            type="button"
            onClick={onToggleNarration}
            className="btn-outline min-h-11 rounded-xl text-sm font-medium md:text-base"
          >
            {narrationPlaying ? "暂停讲解" : "听讲解"}
          </button>
        </div>
      </div>
    </div>
  );
}
