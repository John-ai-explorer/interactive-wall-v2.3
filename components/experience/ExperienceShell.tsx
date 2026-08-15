"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { StoryExperience } from "@/lib/types";
import TopStoryBar from "@/components/experience/TopStoryBar";
import BottomActionDock from "@/components/experience/BottomActionDock";
import StoryBottomSheet from "@/components/experience/StoryBottomSheet";
import QuestionBottomSheet from "@/components/experience/QuestionBottomSheet";
import MediaModal from "@/components/experience/MediaModal";
import CompletionPanel from "@/components/experience/CompletionPanel";
import ScenePoster from "@/components/experience/scene/ScenePoster";
import SpiritImprintCard from "@/components/experience/canvas/SpiritImprintCard";

const ImmersiveScene = dynamic(
  () => import("@/components/experience/scene/ImmersiveScene"),
  {
    ssr: false,
    loading: () => null,
  }
);

type Mode = "intro" | "explore" | "story" | "listen" | "question" | "complete";

type State = {
  mode: Mode;
  chapterIndex: number;
  sceneEntered: boolean;
  sceneReady: boolean;
  bgmEnabled: boolean;
  narrationPlaying: boolean;
  completedChapterIds: string[];
  answeredQuestionIds: string[];
  mediaTriggeredChapterIds: string[];
};

type Action =
  | { type: "enter" }
  | { type: "scene-ready" }
  | { type: "set-mode"; mode: Mode }
  | { type: "set-chapter"; index: number; chapterId: string }
  | { type: "toggle-bgm" }
  | { type: "toggle-narration"; playing: boolean }
  | { type: "answer"; chapterId: string }
  | { type: "media"; chapterId: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "enter":
      return {
        ...state,
        mode: "explore",
        sceneEntered: true,
        bgmEnabled: true,
      };
    case "scene-ready":
      return { ...state, sceneReady: true };
    case "set-mode":
      return { ...state, mode: action.mode };
    case "set-chapter":
      return {
        ...state,
        chapterIndex: action.index,
        narrationPlaying: false,
        completedChapterIds: Array.from(
          new Set([...state.completedChapterIds, action.chapterId])
        ),
      };
    case "toggle-bgm":
      return { ...state, bgmEnabled: !state.bgmEnabled, narrationPlaying: false };
    case "toggle-narration":
      return { ...state, narrationPlaying: action.playing };
    case "answer":
      return {
        ...state,
        answeredQuestionIds: Array.from(
          new Set([...state.answeredQuestionIds, action.chapterId])
        ),
      };
    case "media":
      return {
        ...state,
        mediaTriggeredChapterIds: Array.from(
          new Set([...state.mediaTriggeredChapterIds, action.chapterId])
        ),
      };
    default:
      return state;
  }
}

function initialState(story: StoryExperience): State {
  const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");
  return {
    mode: debug ? "explore" : "intro",
    chapterIndex: 0,
    sceneEntered: debug,
    sceneReady: false,
    bgmEnabled: false,
    narrationPlaying: false,
    completedChapterIds: [story.chapters[0]?.id].filter(Boolean),
    answeredQuestionIds: [],
    mediaTriggeredChapterIds: [],
  };
}

type Props = {
  story: StoryExperience;
  fromScan?: boolean;
};

export default function ExperienceShell({ story, fromScan = false }: Props) {
  const [state, dispatch] = useReducer(reducer, story, initialState);
  const [videoOpen, setVideoOpen] = useState(false);
  const [imprintOpen, setImprintOpen] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; at: number } | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const narrationRef = useRef<HTMLAudioElement | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const storageKey = `experience-progress:${story.id}`;

  const chapter = story.chapters[state.chapterIndex];
  const completedCount = state.completedChapterIds.length;
  const mediaCount = state.mediaTriggeredChapterIds.length;
  const answeredCount = state.answeredQuestionIds.length;
  const canComplete = completedCount >= 4 && mediaCount >= 1 && answeredCount >= 2;

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ chapterIndex: state.chapterIndex })
      );
    } catch {}
  }, [state.chapterIndex, storageKey]);

  useEffect(() => {
    if (!story.audio.bgm) return;
    const audio = new Audio(story.audio.bgm);
    audio.loop = true;
    audio.volume = story.audio.bgmVolume ?? 0.15;
    bgmRef.current = audio;
    return () => {
      audio.pause();
      bgmRef.current = null;
    };
  }, [story.audio.bgm, story.audio.bgmVolume]);

  useEffect(() => {
    const bgm = bgmRef.current;
    if (!bgm) return;
    if (state.bgmEnabled) {
      bgm.volume = state.narrationPlaying
        ? (story.audio.bgmVolume ?? 0.15) * 0.35
        : story.audio.bgmVolume ?? 0.15;
      bgm.play().catch(() => undefined);
    } else {
      bgm.pause();
    }
  }, [state.bgmEnabled, state.narrationPlaying, story.audio.bgmVolume]);

  useEffect(() => {
    const stopAudio = () => {
      bgmRef.current?.pause();
      narrationRef.current?.pause();
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
    };
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAudio();
    });
    return () => stopAudio();
  }, []);

  const goToChapter = useCallback(
    (index: number) => {
      narrationRef.current?.pause();
      narrationRef.current = null;
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
        speechRef.current = null;
      }
      const nextIndex = Math.max(0, Math.min(index, story.chapters.length - 1));
      dispatch({
        type: "set-chapter",
        index: nextIndex,
        chapterId: story.chapters[nextIndex].id,
      });
    },
    [story.chapters]
  );

  const toggleNarration = useCallback(() => {
    if (speechRef.current && typeof window !== "undefined") {
      window.speechSynthesis.cancel();
      speechRef.current = null;
      dispatch({ type: "toggle-narration", playing: false });
      return;
    }

    const narrationSource = chapter.narration || story.audio.narration;

    if (!narrationSource) {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        dispatch({ type: "media", chapterId: chapter.id });
        return;
      }

      const utterance = new SpeechSynthesisUtterance(
        `${chapter.title}。${chapter.summary}。${chapter.body}`
      );
      utterance.lang = "zh-CN";
      utterance.rate = 0.92;
      utterance.pitch = 1;
      utterance.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      const chineseVoice = voices.find((voice) =>
        /zh|Chinese|中文|普通话|Mandarin/i.test(`${voice.lang} ${voice.name}`)
      );
      if (chineseVoice) utterance.voice = chineseVoice;

      utterance.onend = () => {
        speechRef.current = null;
        dispatch({ type: "toggle-narration", playing: false });
      };
      utterance.onerror = () => {
        speechRef.current = null;
        dispatch({ type: "toggle-narration", playing: false });
      };

      speechRef.current = utterance;
      dispatch({ type: "media", chapterId: chapter.id });
      dispatch({ type: "toggle-narration", playing: true });
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      return;
    }
    if (narrationRef.current) {
      narrationRef.current.pause();
      narrationRef.current = null;
      dispatch({ type: "toggle-narration", playing: false });
      return;
    }
    const audio = new Audio(narrationSource);
    audio.onended = () => {
      narrationRef.current = null;
      dispatch({ type: "toggle-narration", playing: false });
    };
    narrationRef.current = audio;
    dispatch({ type: "media", chapterId: chapter.id });
    dispatch({ type: "toggle-narration", playing: true });
    audio.play().catch(() => {
      narrationRef.current = null;
      dispatch({ type: "toggle-narration", playing: false });
    });
  }, [chapter, story.audio.narration]);

  const handleModeChange = useCallback(
    (mode: "explore" | "story" | "listen" | "question") => {
      dispatch({ type: "set-mode", mode });
      if (mode === "listen") toggleNarration();
    },
    [toggleNarration]
  );

  const handleTouchStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (state.mode === "story" || state.mode === "question") return;
    if ((event.target as HTMLElement).closest("[data-no-swipe]")) return;
    touchStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      at: Date.now(),
    };
  };

  const handleTouchEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-no-swipe]")) {
      touchStartRef.current = null;
      return;
    }
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    if (Date.now() - start.at < 80) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy)) return;
    if (Math.abs(dy) < 70) return;
    goToChapter(state.chapterIndex + (dy < 0 ? 1 : -1));
  };

  const themeClass = useMemo(
    () => (story.theme === "lunar-blue" ? "experience-lunar" : "experience-red"),
    [story.theme]
  );

  return (
    <div
      className={`relative h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#080E1A] ${themeClass}`}
      onPointerDown={handleTouchStart}
      onPointerUp={handleTouchEnd}
    >
      <ScenePoster
        story={story}
        chapter={chapter}
        entered={state.sceneEntered}
        sceneReady={state.sceneReady}
        onEnter={() => dispatch({ type: "enter" })}
      />

      {state.sceneEntered && (
        <ImmersiveScene
          story={story}
          chapterIndex={state.chapterIndex}
          showHotspots={state.mode === "story"}
          onReady={() => dispatch({ type: "scene-ready" })}
          onError={() => dispatch({ type: "scene-ready" })}
          onHotspotClick={(index) => {
            goToChapter(index);
            dispatch({ type: "set-mode", mode: "story" });
          }}
        />
      )}

      {state.sceneEntered && (
        <>
          <TopStoryBar
            story={story}
            chapterIndex={state.chapterIndex}
            muted={!state.bgmEnabled}
            onToggleMuted={() => dispatch({ type: "toggle-bgm" })}
          />
          <BottomActionDock
            activeMode={
              state.mode === "question" || state.mode === "story"
                ? state.mode
                : state.mode === "listen"
                ? "listen"
                : "explore"
            }
            canComplete={canComplete}
            onModeChange={handleModeChange}
            onPrev={() => goToChapter(state.chapterIndex - 1)}
            onNext={() => goToChapter(state.chapterIndex + 1)}
            onComplete={() => dispatch({ type: "set-mode", mode: "complete" })}
          />
        </>
      )}

      <StoryBottomSheet
        chapter={chapter}
        chapterIndex={state.chapterIndex}
        open={state.mode === "story"}
        narrationPlaying={state.narrationPlaying}
        onClose={() => dispatch({ type: "set-mode", mode: "explore" })}
        onPlayVideo={() => {
          setVideoOpen(true);
          dispatch({ type: "media", chapterId: chapter.id });
        }}
        onToggleNarration={toggleNarration}
      />

      <QuestionBottomSheet
        chapter={chapter}
        open={state.mode === "question"}
        answered={state.answeredQuestionIds.includes(chapter.id)}
        onClose={() => dispatch({ type: "set-mode", mode: "explore" })}
        onAnswered={(chapterId) => dispatch({ type: "answer", chapterId })}
      />

      <MediaModal
        chapter={chapter}
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        onMediaStarted={() => dispatch({ type: "media", chapterId: chapter.id })}
      />

      {state.mode === "complete" && (
        <CompletionPanel
          story={story}
          completedCount={completedCount}
          mediaCount={mediaCount}
          answeredCount={answeredCount}
          onCreateCard={() => setImprintOpen(true)}
          onClose={() => dispatch({ type: "set-mode", mode: "explore" })}
        />
      )}

      <SpiritImprintCard
        story={story}
        completedCount={completedCount}
        open={imprintOpen}
        onClose={() => setImprintOpen(false)}
      />

      {fromScan && state.mode === "intro" && (
        <div className="absolute left-1/2 top-[calc(5rem+env(safe-area-inset-top))] z-20 -translate-x-1/2 rounded-full border border-[rgba(214,168,79,0.22)] bg-[rgba(8,14,26,0.72)] px-4 py-2 text-xs text-[#E8D7A4] backdrop-blur-md">
          墙面智扫已匹配
        </div>
      )}
    </div>
  );
}
