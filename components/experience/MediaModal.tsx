"use client";

import type { StoryChapter } from "@/lib/types";

type Props = {
  chapter: StoryChapter;
  open: boolean;
  onClose: () => void;
  onMediaStarted: () => void;
};

export default function MediaModal({
  chapter,
  open,
  onClose,
  onMediaStarted,
}: Props) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/82 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#080E1A] p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-[#D6A84F]">聆听·声景讲述</p>
            <h2 className="text-lg font-semibold text-[#F7F2E8]">
              {chapter.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/5 text-[#B9B1A2]"
            aria-label="关闭短片"
          >
            ×
          </button>
        </div>

        {chapter.video ? (
          <video
            className="aspect-video w-full rounded-xl bg-black"
            controls
            preload="metadata"
            poster={chapter.videoPoster || chapter.image}
            onPlay={onMediaStarted}
          >
            <source src={chapter.video} type="video/mp4" />
            当前浏览器无法播放视频，请阅读下方文字摘要。
          </video>
        ) : (
          <img
            src={chapter.videoPoster || chapter.image}
            alt={chapter.title}
            className="aspect-video w-full rounded-xl object-cover"
          />
        )}

        <p className="mt-4 text-sm leading-7 text-[#D9D0C1]">
          {chapter.summary} {chapter.body}
        </p>
      </div>
    </div>
  );
}
