"use client";

import type { PointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NativePlySplatViewer from "@/components/experience/scene/NativePlySplatViewer";
import { getHotspotAnchor } from "@/components/experience/scene/hotspotAnchors";
import GaussianSplatViewer, {
  type CameraOrbitLimits,
  type SceneTheme,
} from "@/components/three/GaussianSplatViewer";
import type { PerformanceTier, StoryExperience } from "@/lib/types";

type OrientConfig = { x: number; y: number; z: number };
type SceneRenderMode = "ply" | "points";
type IntroPhase = "light" | "notice" | "complete";

const DEG_TO_RAD = Math.PI / 180;

const CAMERA_ORBIT_LIMITS: Record<string, CameraOrbitLimits> = {
  // 根据两组 ?debug 截图中的上下边界相机位置换算。
  "qian-xuesen": {
    minPolarAngle: 58 * DEG_TO_RAD,
    maxPolarAngle: 65.2 * DEG_TO_RAD,
    // 截图相机位置 [-0.58, 4.58, 6.66] 相对 target [0, 0.8, 0] 的距离约为 7.68。
    maxDistance: 7.68,
  },
  change5: {
    minPolarAngle: 62.1 * DEG_TO_RAD,
    maxPolarAngle: 74.3 * DEG_TO_RAD,
    // 截图相机位置相对 target 的距离约为 9.72。
    maxDistance: 9.72,
  },
};

type Props = {
  story: StoryExperience;
  chapterIndex: number;
  showHotspots: boolean;
  onReady: () => void;
  onError: () => void;
  onHotspotClick: (index: number) => void;
};

function detectPerformanceTier(): PerformanceTier {
  if (typeof window === "undefined") return "fallback";
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const saveData =
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData ?? false;

  if (!gl || saveData || (memory !== undefined && memory <= 2)) return "fallback";
  if (window.innerWidth >= 900 && (memory === undefined || memory >= 4)) return "high";
  return "medium";
}

export default function ImmersiveScene({
  story,
  chapterIndex,
  showHotspots,
  onReady,
  onError,
  onHotspotClick,
}: Props) {
  const [tier] = useState<PerformanceTier>(() => detectPerformanceTier());
  const [debug] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("debug")
  );
  const plyPath = story.scene.modelHigh;
  const pointsPath = plyPath;
  const shouldRunIntro = Boolean(plyPath);
  const [renderMode, setRenderMode] = useState<SceneRenderMode>(
    plyPath ? "points" : "ply"
  );
  const [introPhase, setIntroPhase] = useState<IntroPhase>("light");
  const [hintVisible, setHintVisible] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const transitionTimersRef = useRef<number[]>([]);
  const introScheduledRef = useRef(false);
  const failedModesRef = useRef<Set<SceneRenderMode>>(new Set());
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  }, [onError, onReady]);

  const clearTransitionTimers = useCallback(() => {
    transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    transitionTimersRef.current = [];
  }, []);

  useEffect(() => clearTransitionTimers, [clearTransitionTimers]);

  useEffect(() => {
    const timer = window.setTimeout(() => setHintVisible(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  const theme: SceneTheme = story.theme === "lunar-blue" ? "space" : "atomic";
  const modelPath = renderMode === "points" ? pointsPath : plyPath;
  const cameraOrbitLimits = CAMERA_ORBIT_LIMITS[story.id];

  const orient = useMemo<OrientConfig>(() => {
    const [x = 0, y = 90, z = 0] = story.scene.initialRotation || [];
    return { x, y, z };
  }, [story.scene.initialRotation]);

  // 初始相机视角：取当前章在 data 里配置的最佳视角（cameraPosition / cameraTarget）
  const activeCamera = useMemo(() => {
    const sceneCfg = story.chapters[chapterIndex]?.scene;
    return {
      position: sceneCfg?.cameraPosition,
      target: sceneCfg?.cameraTarget,
    };
  }, [story.chapters, chapterIndex]);

  // ?debug 视角调参：滑块转模型 + 拖动画面读取相机（仅 points 模式）
  const [debugRotation, setDebugRotation] = useState<OrientConfig>(() => orient);
  const [camReadout, setCamReadout] = useState<{
    position: [number, number, number];
    target: [number, number, number];
  } | null>(null);
  const [copyStatus, setCopyStatus] = useState("复制参数");
  const copyViewpoint = useCallback(async () => {
    if (!camReadout) return;
    const payload = {
      storyId: story.id,
      chapterId: story.chapters[chapterIndex]?.id,
      chapter: chapterIndex + 1,
      initialRotation: [debugRotation.x, debugRotation.y, debugRotation.z],
      cameraPosition: camReadout.position,
      cameraTarget: camReadout.target,
      fov: 58,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopyStatus("已复制");
      window.setTimeout(() => setCopyStatus("复制参数"), 1800);
    } catch {
      setCopyStatus("请手动选择下方参数");
    }
  }, [camReadout, chapterIndex, debugRotation, story.chapters, story.id]);

  const availableModes = useMemo(
    () =>
      [
        plyPath ? { mode: "ply" as const, label: "原始PLY" } : null,
        pointsPath ? { mode: "points" as const, label: "轻量点云" } : null,
      ].filter((item): item is { mode: SceneRenderMode; label: string } => Boolean(item)),
    [plyPath, pointsPath]
  );

  const stopGesture = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (tier === "fallback") {
        setIntroPhase("complete");
        onReadyRef.current();
        return;
      }

      if (!plyPath) {
        setRenderMode("ply");
        setIntroPhase("complete");
        return;
      }

      setRenderMode("points");
      setIntroPhase("light");
      introScheduledRef.current = false;
      failedModesRef.current = new Set();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [plyPath, shouldRunIntro, tier]);

  const scheduleOriginalSceneEntry = useCallback(() => {
    if (debug || !shouldRunIntro || introScheduledRef.current) return;

    introScheduledRef.current = true;
    clearTransitionTimers();

    const noticeTimer = window.setTimeout(() => {
      setIntroPhase("notice");

      const switchTimer = window.setTimeout(() => {
        setRenderMode("ply");
        setIntroPhase("complete");
      }, 1800);

      transitionTimersRef.current.push(switchTimer);
    }, 2200);

    transitionTimersRef.current.push(noticeTimer);
  }, [clearTransitionTimers, shouldRunIntro, debug]);

  const handleSceneReady = useCallback(
    (mode: SceneRenderMode) => {
      onReadyRef.current();
      if (mode === "points" && introPhase === "light") {
        scheduleOriginalSceneEntry();
      }
    },
    [introPhase, scheduleOriginalSceneEntry]
  );

  const completeIntro = useCallback(
    (mode: SceneRenderMode) => {
      clearTransitionTimers();
      introScheduledRef.current = true;
      setIntroPhase("complete");
      setSceneFailed(false);
      setRenderMode(mode);
    },
    [clearTransitionTimers]
  );

  const handleSceneError = useCallback(
    (mode: SceneRenderMode) => {
      failedModesRef.current.add(mode);
      clearTransitionTimers();
      introScheduledRef.current = true;
      setIntroPhase("complete");

      if (
        mode === "points" &&
        plyPath &&
        tier !== "fallback" &&
        !failedModesRef.current.has("ply")
      ) {
        setRenderMode("ply");
        return;
      }

      if (
        mode === "ply" &&
        pointsPath &&
        tier !== "fallback" &&
        !failedModesRef.current.has("points")
      ) {
        setRenderMode("points");
        return;
      }

      setSceneFailed(true);
      onErrorRef.current();
    },
    [clearTransitionTimers, plyPath, pointsPath, tier]
  );

  const handleManualModeChange = useCallback(
    (mode: SceneRenderMode) => {
      completeIntro(mode);
    },
    [completeIntro]
  );

  useEffect(() => {
    return () => {
      clearTransitionTimers();
    };
  }, [clearTransitionTimers]);

  if (tier === "fallback" || !modelPath || sceneFailed) {
    return (
      <div className="absolute inset-0">
        <img
          src={story.scene.fallbackPoster}
          alt={`${story.title}静态场景`}
          className="h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(214,168,79,0.08),transparent_38%),linear-gradient(180deg,rgba(8,14,26,0.18),rgba(8,14,26,0.86))]" />
        <div className="absolute left-5 right-5 top-24 rounded-2xl border border-[rgba(214,168,79,0.2)] bg-[rgba(8,14,26,0.62)] p-4 text-sm leading-6 text-[#D9D0C1] backdrop-blur-md md:left-10 md:w-96">
          当前使用静态场景模式。章节、视频、语音和问答仍可继续体验。
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      {renderMode === "points" && modelPath ? (
        <GaussianSplatViewer
          key={`points:${modelPath}`}
          modelPath={modelPath}
          theme={theme}
          initialRotation={debug ? debugRotation : orient}
          cameraPosition={activeCamera.position}
          cameraTarget={activeCamera.target}
          cameraOrbitLimits={cameraOrbitLimits}
          freezeAutoRotate={debug}
          onCameraChange={
            debug
              ? (position, target) => setCamReadout({ position, target })
              : undefined
          }
          autoRotate={false}
          onLoaded={() => handleSceneReady("points")}
          onError={() => handleSceneError("points")}
          className="absolute inset-0"
        />
      ) : modelPath ? (
        <NativePlySplatViewer
          key={`ply:${modelPath}`}
          modelPath={modelPath}
          sourceLabel="原始 PLY"
          initialRotation={orient}
          cameraPosition={activeCamera.position}
          cameraTarget={activeCamera.target}
          cameraOrbitLimits={cameraOrbitLimits}
          onLoaded={() => handleSceneReady("ply")}
          onError={() => handleSceneError("ply")}
          className="absolute inset-0"
        />
      ) : null}

      {availableModes.length > 1 && (
        <div
          data-no-swipe
          className={`absolute right-4 top-24 z-20 flex rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(8,14,26,0.74)] p-1 text-xs text-[#B9B1A2] backdrop-blur-md transition-opacity duration-500 md:right-8 ${
            introPhase === "complete"
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          onPointerDown={stopGesture}
          onPointerUp={stopGesture}
          onPointerMove={stopGesture}
        >
          {availableModes.map((item) => (
            <button
              key={item.mode}
              type="button"
              onClick={() => handleManualModeChange(item.mode)}
              className={`min-h-8 rounded-full px-3 transition-colors ${
                renderMode === item.mode
                  ? "bg-[#D6A84F] text-[#08101E]"
                  : "hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {introPhase === "notice" && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[rgba(214,168,79,0.32)] bg-[rgba(8,14,26,0.78)] px-6 py-5 text-center text-[#F7F2E8] shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-md">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full border border-[#E8D7A4]/60 bg-[rgba(214,168,79,0.12)] shadow-[0_0_26px_rgba(214,168,79,0.32)]" />
          <p className="text-base font-semibold">正在进入真实三维场景</p>
          <p className="mt-2 text-xs leading-5 text-[#B9B1A2]">
            轻量 3D 预览完成，即将切换为原始 PLY 高精度模型
          </p>
        </div>
      )}

      {showHotspots && story.chapters.map((item, index) => {
        const anchor = getHotspotAnchor(index);
        const active = index === chapterIndex;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onHotspotClick(index)}
            className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border text-sm font-semibold shadow-[0_0_20px_rgba(214,168,79,0.28)] transition-all duration-300 hover:scale-110 ${
              active
                ? "h-12 w-12 border-[#E8D7A4] bg-[#D6A84F] text-[#08101E]"
                : "h-10 w-10 border-[#E8D7A4]/70 bg-[rgba(8,14,26,0.72)] text-[#F7F2E8]"
            }`}
            style={{
              left: `${anchor.left}%`,
              top: `${anchor.top}%`,
            }}
            aria-label={`打开第 ${item.order} 章：${item.title}`}
          >
            {String(item.order).padStart(2, "0")}
          </button>
        );
      })}

      {showHotspots && hintVisible && (
        <div className="absolute left-1/2 top-24 -translate-x-1/2 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(8,14,26,0.7)] px-4 py-2 text-xs text-[#B9B1A2] backdrop-blur-md">
          拖动查看场景，点击节点阅读故事
        </div>
      )}

      {debug && (
        <div
          data-no-swipe
          className="absolute bottom-3 left-3 z-40 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-[rgba(214,168,79,0.4)] bg-[rgba(8,14,26,0.92)] p-4 text-xs text-[#F7F2E8] backdrop-blur-md"
          onPointerDown={stopGesture}
          onPointerUp={stopGesture}
          onPointerMove={stopGesture}
        >
          <p className="mb-1 font-semibold text-[#E8D7A4]">🎥 视角调参（?debug）</p>
          <p className="mb-3 leading-5 text-[#B9B1A2]">
            用滑块转正模型；拖动画面到理想俯视角度。调好后把下方数值发给助手固化。
          </p>
          {(["x", "y", "z"] as const).map((axis) => (
            <label key={axis} className="mb-2 flex items-center gap-2">
              <span className="w-12">旋转{axis.toUpperCase()}</span>
              <input
                type="range"
                min={-180}
                max={180}
                step={5}
                value={debugRotation[axis]}
                onChange={(e) =>
                  setDebugRotation((r) => ({ ...r, [axis]: Number(e.target.value) }))
                }
                className="flex-1"
              />
              <span className="w-10 text-right tabular-nums">{debugRotation[axis]}°</span>
            </label>
          ))}
          <button type="button" onClick={copyViewpoint} disabled={!camReadout} className="mt-2 min-h-9 w-full rounded-lg border border-[rgba(214,168,79,0.35)] px-3 text-xs text-[#E8D7A4] disabled:opacity-40">{copyStatus}</button>
          <pre className="mt-3 select-all whitespace-pre-wrap rounded-lg bg-black/40 p-2 leading-5 text-[#D9D0C1]">
{`initialRotation: [${debugRotation.x}, ${debugRotation.y}, ${debugRotation.z}]
cameraPosition: ${camReadout ? JSON.stringify(camReadout.position) : "（拖动画面后显示）"}
cameraTarget: ${camReadout ? JSON.stringify(camReadout.target) : "（拖动画面后显示）"}`}
          </pre>
        </div>
      )}

      <button
        type="button"
        onClick={onError}
        className="sr-only"
        aria-label="切换到静态场景"
      />
    </div>
  );
}
