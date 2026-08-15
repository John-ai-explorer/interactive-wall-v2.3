"use client";

import Link from "next/link";
import type { StoryExperience } from "@/lib/types";

type Props = {
  story: StoryExperience;
  completedCount: number;
  mediaCount: number;
  answeredCount: number;
  onCreateCard: () => void;
  onClose: () => void;
};

export default function CompletionPanel({
  story,
  completedCount,
  mediaCount,
  answeredCount,
  onCreateCard,
  onClose,
}: Props) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/78 p-4 backdrop-blur-md">
      <div className="w-full max-w-md animate__animated animate__fadeInUp rounded-2xl border border-[rgba(214,168,79,0.24)] bg-[rgba(8,14,26,0.96)] p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-[#D6A84F]">体验完成</p>
            <h2 className="mt-1 text-2xl font-bold text-[#F7F2E8]">
              {story.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#B9B1A2]">
              已探索 {completedCount}/5 个节点，完成 {answeredCount} 个问题，触发 {mediaCount} 次声景或短片。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/5 text-[#B9B1A2]"
            aria-label="关闭完成面板"
          >
            ×
          </button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {story.spiritKeywords.slice(0, 3).map((keyword) => (
            <span
              key={keyword}
              className="rounded-full border border-[rgba(214,168,79,0.32)] bg-[rgba(214,168,79,0.1)] px-3 py-1 text-sm text-[#E8D7A4]"
            >
              {keyword}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={onCreateCard}
          className="btn-primary mb-4 min-h-12 w-full rounded-xl font-semibold"
        >
          生成精神印记卡
        </button>

        <div className="rounded-xl border border-white/10 bg-[url('/assets/ui/v2/extended_learning_bg.png')] bg-cover bg-center p-4">
          <p className="mb-3 text-sm font-medium text-[#F7F2E8]">延伸学习</p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/qa" className="rounded-lg bg-[rgba(8,14,26,0.7)] px-3 py-2 text-center text-sm text-[#D6A84F]">
              知识问答
            </Link>
            <Link href="/news" className="rounded-lg bg-[rgba(8,14,26,0.7)] px-3 py-2 text-center text-sm text-[#D6A84F]">
              新闻速递
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
