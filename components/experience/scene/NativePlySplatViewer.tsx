"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CameraOrbitLimits } from "@/components/three/GaussianSplatViewer";

type OrientConfig = { x: number; y: number; z: number };

type Props = {
  modelPath: string;
  initialRotation?: OrientConfig;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  cameraOrbitLimits?: CameraOrbitLimits;
  sourceLabel?: string;
  className?: string;
  onProgress?: (pct: number) => void;
  onLoaded?: () => void;
  onError?: () => void;
};

type SplatModule = typeof import("@mkkellogg/gaussian-splats-3d");

type NativeOrbitControls = {
  minPolarAngle: number;
  maxPolarAngle: number;
  minDistance: number;
  maxDistance: number;
  enablePan: boolean;
  update: () => void;
};

function normalizeProgress(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value > 1 ? value / 100 : value));
}

function degToRad(value: number) {
  return (value * Math.PI) / 180;
}

function eulerToQuaternion({ x, y, z }: OrientConfig): [number, number, number, number] {
  const cx = Math.cos(degToRad(x) / 2);
  const sx = Math.sin(degToRad(x) / 2);
  const cy = Math.cos(degToRad(y) / 2);
  const sy = Math.sin(degToRad(y) / 2);
  const cz = Math.cos(degToRad(z) / 2);
  const sz = Math.sin(degToRad(z) / 2);

  return [
    sx * cy * cz + cx * sy * sz,
    cx * sy * cz - sx * cy * sz,
    cx * cy * sz + sx * sy * cz,
    cx * cy * cz - sx * sy * sz,
  ];
}

function getSceneFormat(GaussianSplats3D: SplatModule, path: string) {
  if (path.endsWith(".spz")) return GaussianSplats3D.SceneFormat.Spz;
  if (path.endsWith(".splat")) return GaussianSplats3D.SceneFormat.Splat;
  if (path.endsWith(".ksplat")) return GaussianSplats3D.SceneFormat.KSplat;
  return GaussianSplats3D.SceneFormat.Ply;
}

export default function NativePlySplatViewer({
  modelPath,
  initialRotation,
  cameraPosition,
  cameraTarget,
  cameraOrbitLimits,
  sourceLabel = "原始 PLY",
  className = "",
  onProgress,
  onLoaded,
  onError,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const onProgressRef = useRef(onProgress);
  const onLoadedRef = useRef(onLoaded);
  const onErrorRef = useRef(onError);
  // 相机初始视角用 ref 持有最新值，避免进入加载 effect 的依赖（改相机不应触发模型重载）
  const cameraPositionRef = useRef(cameraPosition);
  const cameraTargetRef = useRef(cameraTarget);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    onProgressRef.current = onProgress;
    onLoadedRef.current = onLoaded;
    onErrorRef.current = onError;
  }, [onError, onLoaded, onProgress]);

  useEffect(() => {
    cameraPositionRef.current = cameraPosition;
    cameraTargetRef.current = cameraTarget;
  }, [cameraPosition, cameraTarget]);

  const rotation = useMemo(
    () =>
      eulerToQuaternion({
        x: initialRotation?.x ?? 0,
        y: initialRotation?.y ?? 90,
        z: initialRotation?.z ?? 0,
      }),
    [initialRotation?.x, initialRotation?.y, initialRotation?.z]
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let cancelled = false;
    let viewer:
      | InstanceType<SplatModule["Viewer"]>
      | null = null;

    setLoading(true);
    setError(false);
    setProgress(0);
    onProgressRef.current?.(0);

    import("@mkkellogg/gaussian-splats-3d")
      .then((GaussianSplats3D) => {
        if (cancelled) return;

        viewer = new GaussianSplats3D.Viewer({
          rootElement: root,
          cameraUp: [0, 1, 0],
          initialCameraPosition: cameraPositionRef.current ?? [0, 1.4, 6],
          initialCameraLookAt: cameraTargetRef.current ?? [0, 0.5, 0],
          useBuiltInControls: true,
          ignoreDevicePixelRatio: false,
          gpuAcceleratedSort: false,
          sharedMemoryForWorkers: false,
          renderMode: GaussianSplats3D.RenderMode.Always,
          sceneRevealMode: GaussianSplats3D.SceneRevealMode.Gradual,
          sphericalHarmonicsDegree: 2,
          focalAdjustment: 1.2,
          maxScreenSpaceSplatSize: 2048,
          optimizeSplatData: true,
          freeIntermediateSplatData: true,
          logLevel: GaussianSplats3D.LogLevel.Error,
        });

        const controls = (viewer as typeof viewer & {
          controls?: NativeOrbitControls;
        }).controls;
        if (controls) {
          controls.minPolarAngle = cameraOrbitLimits?.minPolarAngle ?? 0.1;
          controls.maxPolarAngle = cameraOrbitLimits?.maxPolarAngle ?? Math.PI * 0.75;
          controls.minDistance = cameraOrbitLimits?.minDistance ?? 0.8;
          controls.maxDistance = cameraOrbitLimits?.maxDistance ?? 18;
          controls.enablePan = false;
          controls.update();
        }

        return viewer.addSplatScene(modelPath, {
          format: getSceneFormat(GaussianSplats3D, modelPath),
          showLoadingUI: false,
          progressiveLoad: true,
          splatAlphaRemovalThreshold: 1,
          rotation,
          scale: [1, 1, 1],
          onProgress: (pct) => {
            const nextProgress = normalizeProgress(pct);
            setProgress(nextProgress);
            onProgressRef.current?.(nextProgress);
          },
        });
      })
      .then(() => {
        if (cancelled || !viewer) return;
        viewer.start();
        setProgress(1);
        setLoading(false);
        onProgressRef.current?.(1);
        onLoadedRef.current?.();
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("Native PLY Gaussian splat load error:", err);
        setError(true);
        setLoading(false);
        onErrorRef.current?.();
      });

    return () => {
      cancelled = true;
      if (viewer) {
        try {
          viewer.stop();
          viewer.dispose();
        } catch (err) {
          console.warn("Native PLY Gaussian splat cleanup warning:", err);
        }
      }
      root.replaceChildren();
    };
  }, [cameraOrbitLimits, modelPath, rotation]);

  return (
    <div
      className={`relative overflow-hidden bg-[#05070B] ${className}`}
      style={{ width: "100%", height: "100%" }}
    >
      <div ref={rootRef} className="absolute inset-0 [&_canvas]:!h-full [&_canvas]:!w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(214,168,79,0.08),transparent_42%),linear-gradient(180deg,rgba(8,14,26,0.08),rgba(8,14,26,0.55))]" />

      {loading && !error && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-[rgba(5,7,11,0.62)] text-[#F7F2E8] backdrop-blur-sm">
          <div className="mb-5 h-16 w-16 animate-spin rounded-full border-2 border-[rgba(255,255,255,0.16)] border-t-[#E8D7A4]" />
          <p className="text-base font-medium">加载{sourceLabel}三维场景</p>
          <div className="mt-4 h-2 w-72 max-w-[70vw] overflow-hidden rounded-full bg-[rgba(255,255,255,0.12)]">
            <div
              className="h-full rounded-full bg-[#E8D7A4] transition-all duration-300"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-[#B9B1A2]">{Math.round(progress * 100)}%</p>
        </div>
      )}
    </div>
  );
}
