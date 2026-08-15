"use client";

import type { StoryExperience, StoryChapter } from "@/lib/types";

type Props = {
  story: StoryExperience;
  chapter: StoryChapter;
  entered: boolean;
  sceneReady: boolean;
  onEnter: () => void;
};

export default function ScenePoster({
  story,
  chapter,
  entered,
  sceneReady,
  onEnter,
}: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#080E1A]">
      <img
        src={story.hero.mobilePoster || story.hero.poster}
        alt={`${story.title}主视觉`}
        className="h-full w-full object-cover opacity-75"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,14,26,0.18),rgba(8,14,26,0.52)_45%,rgba(8,14,26,0.9))]" />
      <div className="absolute inset-0 bg-[url('/assets/ui/v2/model_loading_overlay.png')] bg-cover bg-center opacity-25" />

      {!entered && (
        <div className="absolute inset-x-0 bottom-[calc(7.5rem+env(safe-area-inset-bottom))] px-5 md:bottom-10 md:left-10 md:max-w-xl">
          <div className="animate__animated animate__fadeInUp">
            <p className="mb-3 text-sm font-medium text-[#D6A84F]">
              {story.subtitle}
            </p>
            <h1 className="mb-3 text-3xl font-bold leading-tight text-[#F7F2E8] md:text-5xl">
              {story.title}
            </h1>
            <p className="mb-5 max-w-2xl text-sm leading-7 text-[#D7D0C2] md:text-base">
              {story.description}
            </p>
            <div className="mb-6 flex flex-wrap gap-2">
              {story.spiritKeywords.slice(0, 5).map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-[rgba(214,168,79,0.32)] bg-[rgba(8,14,26,0.48)] px-3 py-1 text-xs text-[#E8D7A4]"
                >
                  {keyword}
                </span>
              ))}
            </div>
            <button
              onClick={onEnter}
              className="btn-primary min-h-12 rounded-xl px-6 text-base font-semibold"
            >
              开始沉浸探索
            </button>
          </div>
        </div>
      )}

      {entered && !sceneReady && (
        <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 rounded-2xl border border-[rgba(214,168,79,0.22)] bg-[rgba(8,14,26,0.72)] p-5 text-center backdrop-blur-md md:left-1/2 md:w-96 md:-translate-x-1/2">
          <p className="mb-2 text-sm text-[#D6A84F]">三维场景加载中</p>
          <p className="text-xs leading-6 text-[#B9B1A2]">
            可先阅读当前章节，网络较慢或设备不支持 WebGL 时会自动保留静态场景。
          </p>
        </div>
      )}

      {entered && (
        <div className="absolute inset-x-4 bottom-[calc(5.7rem+env(safe-area-inset-bottom))] rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(8,14,26,0.6)] p-4 backdrop-blur-md md:left-10 md:right-auto md:w-[26rem]">
          <p className="mb-1 text-xs text-[#D6A84F]">
            {String(chapter.order).padStart(2, "0")} / 05
          </p>
          <h2 className="text-lg font-semibold text-[#F7F2E8]">
            {chapter.title}
          </h2>
          <p className="mt-1 text-sm text-[#B9B1A2]">{chapter.summary}</p>
        </div>
      )}
    </div>
  );
}
