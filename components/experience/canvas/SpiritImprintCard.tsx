"use client";

import { useCallback, useEffect, useState } from "react";
import type { StoryExperience } from "@/lib/types";
import { renderImprintCard } from "@/lib/imprint-card";

type Props = {
  story: StoryExperience;
  completedCount: number;
  open: boolean;
  onClose: () => void;
};

export default function SpiritImprintCard({
  story,
  completedCount,
  open,
  onClose,
}: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const generateCard = useCallback(() => {
    setGenerating(true);
    setError(null);
    const dateLabel = new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date());

    renderImprintCard({ story, completedCount, dateLabel })
      .then(setImageUrl)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "印记卡生成失败")
      )
      .finally(() => {
        window.setTimeout(() => setGenerating(false), 600);
      });
  }, [completedCount, story]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(generateCard, 0);
    return () => window.clearTimeout(timer);
  }, [generateCard, open]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/84 p-4 backdrop-blur-md">
      <div className="max-h-[92dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-[rgba(214,168,79,0.24)] bg-[#080E1A] p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#D6A84F]">留印·精神印记</p>
            <h2 className="text-lg font-semibold text-[#F7F2E8]">数字纪念卡</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/5 text-[#B9B1A2]"
            aria-label="关闭印记卡"
          >
            ×
          </button>
        </div>

        {generating && (
          <div className="flex h-80 items-center justify-center rounded-xl bg-white/5 text-sm text-[#D6A84F]">
            生成中...
          </div>
        )}

        {!generating && imageUrl && (
          <img
            src={imageUrl}
            alt={`${story.title}精神印记卡`}
            className="animate__animated animate__zoomIn w-full rounded-xl"
          />
        )}

        {!generating && error && (
          <div className="rounded-xl border border-[rgba(195,40,40,0.3)] bg-[rgba(195,40,40,0.12)] p-4 text-sm text-[#F2B9AA]">
            {error}
          </div>
        )}

        {imageUrl && (
          <a
            href={imageUrl}
            download={`${story.id}-spirit-imprint.png`}
            className="btn-primary mt-4 block rounded-xl px-5 py-3 text-center text-sm font-medium"
          >
            保存 PNG
          </a>
        )}
      </div>
    </div>
  );
}
