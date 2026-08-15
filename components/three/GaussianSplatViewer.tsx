"use client";

import { type ElementRef, useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { loadPlyFile } from "@/lib/ply-parser";

/* ================================================================
   Theme definitions — each scene gets a unique color identity
   ================================================================ */
export type SceneTheme = "space" | "atomic";

type ThemeColors = {
  bg1: string;
  bg2: string;
  bg3: string;
  ambientLight: string;
  lights: { color: string; position: [number, number, number]; intensity: number }[];
  glowPalette: string[];
  pointAlpha: number;
  glowAlpha: number;
};

const THEMES: Record<SceneTheme, ThemeColors> = {
  space: {
    // Deep space blue/purple → silver/cyan particles
    bg1: "#020818",
    bg2: "#050d24",
    bg3: "#0a0f2a",
    ambientLight: "#0a0a20",
    lights: [
      { color: "#4488CC", position: [3, 4, 5], intensity: 4.0 },
      { color: "#8899DD", position: [-4, 2, -3], intensity: 3.0 },
      { color: "#AAC8FF", position: [0, 5, 0], intensity: 2.5 },
      { color: "#6644AA", position: [-2, -2, 4], intensity: 2.0 },
      { color: "#CCDDFF", position: [2, -1, -4], intensity: 1.5 },
    ],
    glowPalette: [
      "#4488CC", "#6699DD", "#88AAEE", "#AACCFF",
      "#CCDDFF", "#99BBFF", "#5555AA", "#E8EEFF",
    ],
    pointAlpha: 0.92,
    glowAlpha: 0.5,
  },
  atomic: {
    // Hot desert red/orange → fiery particles
    bg1: "#0d0303",
    bg2: "#1a0604",
    bg3: "#0f0804",
    ambientLight: "#0d0806",
    lights: [
      { color: "#FF6622", position: [3, 3, 4], intensity: 4.5 },
      { color: "#FF4422", position: [-3, -1, -2], intensity: 3.5 },
      { color: "#FFAA44", position: [0, 4, -2], intensity: 3.0 },
      { color: "#DD3300", position: [2, -2, 3], intensity: 2.5 },
      { color: "#FFD080", position: [-1, 2, 1], intensity: 2.0 },
    ],
    glowPalette: [
      "#FF6622", "#FF8844", "#FFAA55", "#FF4400",
      "#FFCC88", "#FF7744", "#EE5522", "#FFDDA0",
    ],
    pointAlpha: 0.95,
    glowAlpha: 0.6,
  },
};

export type OrientConfig = { x: number; y: number; z: number };

export type CameraOrbitLimits = {
  minPolarAngle: number;
  maxPolarAngle: number;
  minDistance?: number;
  maxDistance?: number;
};

type Props = {
  modelPath: string;
  theme: SceneTheme;
  initialRotation?: OrientConfig; // degrees: x, y, z
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  cameraOrbitLimits?: CameraOrbitLimits;
  freezeAutoRotate?: boolean;
  onCameraChange?: (
    position: [number, number, number],
    target: [number, number, number]
  ) => void;
  className?: string;
  autoRotate?: boolean;
  onProgress?: (pct: number) => void;
  onLoaded?: () => void;
  onError?: () => void;
};

/* ================================================================
   Point Cloud — loads PLY, renders as colored points
   ================================================================ */
function PointCloudScene({
  modelPath,
  theme,
  initialRotation,
  freeze,
  onProgress,
  onLoaded,
  onError,
}: {
  modelPath: string;
  theme: SceneTheme;
  initialRotation?: OrientConfig;
  freeze?: boolean;
  onProgress?: (pct: number) => void;
  onLoaded?: () => void;
  onError?: () => void;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    let cancelled = false;

    const load = async () => {
      try {
        onProgress?.(0.1);
        const ply = await loadPlyFile(modelPath);
        if (cancelled) return;
        onProgress?.(0.6);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(ply.positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(ply.colors, 3));

        if (cancelled) return;
        onProgress?.(0.95);
        setGeo(geometry);
        onProgress?.(1.0);
        onLoaded?.();
      } catch (err: unknown) {
        if (!cancelled) {
          console.error("PLY load error:", err);
          setError(`加载失败: ${err instanceof Error ? err.message : "未知错误"}`);
          onError?.();
        }
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelPath]);

  // Apply initial rotation from config (degrees → radians) + slow drift
  const deg2rad = (d: number) => (d * Math.PI) / 180;
  const rx = useRef(deg2rad(initialRotation?.x ?? 0));
  const ry = useRef(deg2rad(initialRotation?.y ?? 90));
  const rz = useRef(deg2rad(initialRotation?.z ?? 0));

  // Update when initialRotation prop changes
  useEffect(() => {
    rx.current = deg2rad(initialRotation?.x ?? 0);
    ry.current = deg2rad(initialRotation?.y ?? 90);
    rz.current = deg2rad(initialRotation?.z ?? 0);
  }, [initialRotation?.x, initialRotation?.y, initialRotation?.z]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      if (!freeze) ry.current += delta * 0.05; // slow drift on Y only (paused while tuning)
      pointsRef.current.rotation.set(rx.current, ry.current, rz.current);
    }
  });

  if (error) return <ErrorMesh />;
  if (!geo) return <LoadingRing theme={theme} />;

  const vertexCount = geo.attributes.position?.count ?? 0;
  const t = THEMES[theme];

  return (
    <group>
      {/* Main point cloud — 3x larger points */}
      <points ref={pointsRef} geometry={geo}>
        <pointsMaterial
          size={vertexCount > 400000 ? 0.032 : 0.048}
          vertexColors
          transparent
          opacity={t.pointAlpha}
          blending={THREE.NormalBlending}
          depthWrite
          sizeAttenuation
        />
      </points>

      {/* Ambient glow — 3x more particles, themed colors */}
      <AmbientGlow theme={theme} />
    </group>
  );
}

/* ================================================================
   Error
   ================================================================ */
function ErrorMesh() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#8B1E1E" wireframe emissive="#C32828" emissiveIntensity={0.5} />
    </mesh>
  );
}

/* ================================================================
   Loading Ring — themed colors
   ================================================================ */
function LoadingRing({ theme }: { theme: SceneTheme }) {
  const ringRef = useRef<THREE.Group>(null);
  const colors = theme === "space"
    ? ["#4488CC", "#AACCFF", "#6644AA"]
    : ["#FF6622", "#FFAA44", "#FF4400"];

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.8;
      ringRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={ringRef}>
      <mesh>
        <torusGeometry args={[2, 0.08, 16, 100]} />
        <meshStandardMaterial color={colors[0]} emissive={colors[0]} emissiveIntensity={1.2} metalness={0.5} roughness={0.2} />
      </mesh>
      <mesh>
        <torusGeometry args={[1.6, 0.06, 16, 80]} />
        <meshStandardMaterial color={colors[1]} emissive={colors[1]} emissiveIntensity={1.5} metalness={0.4} roughness={0.2} />
      </mesh>
      <mesh>
        <torusGeometry args={[2.4, 0.04, 16, 120]} />
        <meshStandardMaterial color={colors[2]} emissive={colors[2]} emissiveIntensity={0.8} metalness={0.3} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ================================================================
   Ambient Glow — dense soft glow sphere around the model
   ================================================================ */
function AmbientGlow({ theme }: { theme: SceneTheme }) {
  const ref = useRef<THREE.Points>(null);
  const t = THEMES[theme];

  const { positions, colorArray } = useMemo(() => {
      const count = 600;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = t.glowPalette.map(c => new THREE.Color(c));
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 2.0 + Math.random() * 7.0;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colorArray: col };
  }, [t.glowPalette]);

  const baseY = useRef(Math.PI / 2);

  useFrame((_, delta) => {
    if (ref.current) {
      baseY.current += delta * 0.025;
      ref.current.rotation.y = baseY.current;
      ref.current.rotation.x += delta * 0.012;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.09}
        vertexColors
        transparent
        opacity={t.glowAlpha}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ================================================================
   Themed Lights
   ================================================================ */
function SceneLights({ theme }: { theme: SceneTheme }) {
  const t = THEMES[theme];
  const keyRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (keyRef.current) {
      keyRef.current.intensity = t.lights[0].intensity + Math.sin(Date.now() * 0.0008) * 0.6;
    }
  });

  return (
    <>
      <ambientLight color={t.ambientLight} intensity={0.8} />
      {t.lights.map((l, i) => (
        <pointLight
          key={i}
          ref={i === 0 ? keyRef : undefined}
          position={l.position}
          color={l.color}
          intensity={l.intensity}
          distance={18}
          decay={2}
        />
      ))}
      <directionalLight position={[0, 6, 0]} color="#ffffff" intensity={0.3} />
    </>
  );
}

/* ================================================================
   Themed Starfield / Heat-haze for each theme
   ================================================================ */
function ThemedBackground({ theme }: { theme: SceneTheme }) {
  const ref = useRef<THREE.Points>(null);
  const t = THEMES[theme];

  const { positions, colorArray } = useMemo(() => {
    const count = theme === "space" ? 700 : 420;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = t.glowPalette.map(c => new THREE.Color(c));

    for (let i = 0; i < count; i++) {
      // Space: scattered sphere. Atomic: concentrated ring/disc
      if (theme === "space") {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = 8 + Math.random() * 12;
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.cos(phi);
        pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      } else {
        // Atomic: expanding ring/disc shape like shockwave
        const angle = Math.random() * Math.PI * 2;
        const r = 3 + Math.random() * 10;
        pos[i * 3] = Math.cos(angle) * r;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
        pos[i * 3 + 2] = Math.sin(angle) * r;
      }

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colorArray: col };
  }, [theme, t.glowPalette]);

  const baseY = useRef(Math.PI / 2);

  useFrame((_, delta) => {
    if (ref.current) {
      baseY.current += delta * 0.015;
      ref.current.rotation.y = baseY.current;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={theme === "space" ? 0.06 : 0.1}
        vertexColors
        transparent
        opacity={theme === "space" ? 0.4 : 0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ================================================================
   Exported Component
   ================================================================ */
export default function GaussianSplatViewer({
  modelPath,
  theme,
  initialRotation,
  cameraPosition,
  cameraTarget,
  cameraOrbitLimits,
  freezeAutoRotate = false,
  onCameraChange,
  className = "",
  autoRotate = false,
  onProgress,
  onLoaded,
  onError,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<ElementRef<typeof OrbitControls>>(null);
  const t = THEMES[theme];

  const handleProgress = (pct: number) => {
    setLoadProgress(Math.round(pct * 100));
    onProgress?.(pct);
  };

  const handleLoaded = () => {
    setLoading(false);
    onLoaded?.();
  };

  const handleError = () => {
    setLoading(false);
    setError("当前设备或网络无法加载三维模型，已保留文字故事体验。");
    onError?.();
  };

  return (
    <div className={`relative ${className}`} style={{ width: "100%", height: "100%" }}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        camera={{ position: cameraPosition ?? [0, 0.5, 6], fov: 58 }}
        style={{
          background: `radial-gradient(ellipse at center, ${t.bg1} 0%, ${t.bg2} 40%, ${t.bg3} 100%)`,
        }}
      >
        <fog attach="fog" args={[t.bg1, 4, 20]} />
        <SceneLights theme={theme} />
        <ThemedBackground theme={theme} />
        <PointCloudScene
          modelPath={modelPath}
          theme={theme}
          initialRotation={initialRotation}
          freeze={freezeAutoRotate}
          onProgress={handleProgress}
          onLoaded={handleLoaded}
          onError={handleError}
        />
        <OrbitControls
          ref={controlsRef}
          autoRotate={autoRotate}
          autoRotateSpeed={0.25}
          target={cameraTarget ?? [0, 0, 0]}
          minDistance={cameraOrbitLimits?.minDistance ?? 0.8}
          maxDistance={cameraOrbitLimits?.maxDistance ?? 18}
          minPolarAngle={cameraOrbitLimits?.minPolarAngle}
          maxPolarAngle={cameraOrbitLimits?.maxPolarAngle}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          onEnd={
            onCameraChange
              ? () => {
                  const c = controlsRef.current;
                  if (!c) return;
                  const round = (n: number) => Math.round(n * 100) / 100;
                  const p = c.object.position;
                  const tg = c.target;
                  onCameraChange(
                    [round(p.x), round(p.y), round(p.z)],
                    [round(tg.x), round(tg.y), round(tg.z)]
                  );
                }
              : undefined
          }
        />
      </Canvas>

      {/* Loading overlay */}
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="w-20 h-20 rounded-full border-3 border-[rgba(255,255,255,0.1)] border-t-current animate-spin mb-5"
            style={{ color: t.glowPalette[0] }} />
          <p className="text-xl font-medium" style={{ color: t.glowPalette[1] }}>
            加载3D场景中
          </p>
          <div className="mt-4 w-80 h-2.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${loadProgress}%`,
                background: `linear-gradient(90deg, ${t.glowPalette[2]}, ${t.glowPalette[0]})`,
              }}
            />
          </div>
          <p className="text-[#888] text-base mt-2">{loadProgress}%</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center p-8 rounded-xl"
            style={{ background: "rgba(139, 30, 30, 0.25)", border: "1px solid rgba(139, 30, 30, 0.4)" }}>
            <p className="text-[#C32828] text-xl font-medium mb-2">加载失败</p>
            <p className="text-[#B9B1A2] text-base">{error}</p>
          </div>
        </div>
      )}

      {/* Controls hint */}
      {!loading && !error && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-10">
          <span className="text-base px-5 py-2 rounded-full"
            style={{ background: "rgba(8, 14, 26, 0.75)", border: "1px solid rgba(255,255,255,0.1)", color: t.glowPalette[1] }}>
            拖拽旋转 &nbsp;|&nbsp; 缩放观察
          </span>
        </div>
      )}
    </div>
  );
}
