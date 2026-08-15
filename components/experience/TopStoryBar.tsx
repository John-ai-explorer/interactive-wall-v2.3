"use client";

import Link from "next/link";
import type { StoryExperience } from "@/lib/types";

type Props = {
  story: StoryExperience;
  chapterIndex: number;
  muted: boolean;
  onToggleMuted: () => void;
};

export default function TopStoryBar({
  story,
  chapterIndex,
  muted,
  onToggleMuted,
}: Props) {
  return (
    <div className="absolute inset-x-0 top-0 z-30 px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] md:px-6">
      <div className="mx-auto flex h-14 max-w-[86rem] items-center justify-between rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(8,14,26,0.68)] px-4 md:px-6 backdrop-blur-md">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#D6A84F] transition-colors hover:bg-white/5"
          aria-label="返回首页"
        >
          ‹
        </Link>
        <div className="min-w-0 flex-1 px-3 text-center">
          <p className="truncate text-sm font-semibold text-[#F7F2E8]">
            {story.shortTitle}
          </p>
          <div className="mx-auto mt-1 h-1 max-w-36 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#D6A84F] transition-all duration-300"
              style={{ width: `${((chapterIndex + 1) / story.chapters.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#B9B1A2]">
            {String(chapterIndex + 1).padStart(2, "0")}/
            {String(story.chapters.length).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={onToggleMuted}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#D6A84F] transition-colors hover:bg-white/5"
            aria-label={muted ? "取消静音" : "静音"}
          >
            {muted ? "×" : "♪"}
          </button>
        </div>
      </div>
    </div>
  );
}
