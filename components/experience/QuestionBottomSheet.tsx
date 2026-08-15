"use client";

import { useState } from "react";
import type { StoryChapter } from "@/lib/types";

type Props = {
  chapter: StoryChapter;
  open: boolean;
  answered: boolean;
  onClose: () => void;
  onAnswered: (chapterId: string) => void;
};

export default function QuestionBottomSheet({
  chapter,
  open,
  answered,
  onClose,
  onAnswered,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const question = chapter.question;
  if (!open || !question) return null;

  const isCorrect =
    selected !== null && question.correctIndex !== undefined
      ? selected === question.correctIndex
      : selected !== null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 animate__animated animate__fadeInUp md:inset-y-auto md:bottom-24 md:left-1/2 md:w-[26rem] md:-translate-x-1/2">
      <div className="rounded-t-3xl border border-[rgba(214,168,79,0.2)] bg-[rgba(8,14,26,0.94)] p-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl md:rounded-2xl md:pb-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs text-[#D6A84F]">对话·节点问答</p>
            <h2 className="text-lg font-bold leading-7 text-[#F7F2E8]">
              {question.question}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/5 text-[#B9B1A2]"
            aria-label="关闭问答"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {(question.options || ["我已观察到线索"]).map((option, index) => {
            const active = selected === index;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setSelected(index);
                  onAnswered(chapter.id);
                }}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  active
                    ? "border-[#D6A84F] bg-[rgba(214,168,79,0.12)] text-[#F7F2E8]"
                    : "border-white/10 bg-white/5 text-[#D9D0C1]"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {(selected !== null || answered) && (
          <div
            className={`mt-4 rounded-xl border p-4 text-sm leading-6 ${
              isCorrect || answered
                ? "animate__animated animate__zoomIn border-[rgba(214,168,79,0.28)] bg-[rgba(214,168,79,0.1)] text-[#E8D7A4]"
                : "animate__animated animate__shakeX border-[rgba(195,40,40,0.28)] bg-[rgba(195,40,40,0.1)] text-[#F2B9AA]"
            }`}
          >
            {question.feedback}
          </div>
        )}
      </div>
    </div>
  );
}
