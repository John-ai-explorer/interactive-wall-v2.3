"use client";

import Link from "next/link";
import { resolveStoryId } from "@/lib/stories";
import type { RecognizeResult } from "@/lib/types";

type Props = {
  result: RecognizeResult;
  onReset: () => void;
};

export default function RecognizeResultCard({ result, onReset }: Props) {
  const storyId = resolveStoryId(result.story_id || result.event_id || "qian-xuesen");
  const confidence = Math.max(0, Math.min(1, result.confidence));
  const threshold = Math.max(0, Math.min(1, result.minConfidence ?? 0.65));

  return (
    <div
      className="animate__animated animate__fadeInUp p-8 rounded-2xl text-center max-w-md mx-auto"
      style={{
        background: "rgba(255, 255, 255, 0.06)",
        border: "1px solid rgba(214, 168, 79, 0.35)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
        style={{ background: "rgba(214, 168, 79, 0.15)" }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D6A84F" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-[#F7F2E8] mb-2">识别成功</h3>
      <p className="text-[#D6A84F] text-lg font-medium mb-1">{result.title}</p>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-[#B9B1A2] mb-1">
          <span>置信度</span>
          <span>{(confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${confidence * 100}%`, background: "linear-gradient(90deg, #D6A84F, #F2C879)" }}
          />
        </div>
        {result.minConfidence != null && (
          <p className="mt-1 text-[11px] text-[#6a6255]">
            阈值 {(threshold * 100).toFixed(0)}%
          </p>
        )}
      </div>

      {result.reason && (
        <p className="text-[#B9B1A2] text-sm leading-relaxed mb-4">
          {result.reason}
        </p>
      )}

      {Array.isArray(result.tags) && result.tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {result.tags.slice(0, 8).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-white/8 text-[#D6A84F]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={`/experience/${storyId}?from=scan`}
          className="btn-primary inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-medium"
        >
          进入沉浸体验
        </Link>
        <button
          onClick={onReset}
          className="btn-outline px-6 py-2.5 rounded-xl font-medium"
        >
          重新拍摄
        </button>
      </div>
    </div>
  );
}
