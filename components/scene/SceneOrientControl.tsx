"use client";

import { useState, useCallback } from "react";

type OrientConfig = { x: number; y: number; z: number };

type Props = {
  sceneId: string;
  accent: string;
  accent2: string;
  bg: string;
  config: OrientConfig;
  onChange: (config: OrientConfig) => void;
  onReset: () => void;
};

export type { OrientConfig };

export default function SceneOrientControl({
  sceneId,
  accent,
  accent2,
  bg,
  config,
  onChange,
  onReset,
}: Props) {
  const [open, setOpen] = useState(false);

  const update = useCallback(
    (axis: "x" | "y" | "z", value: number) => {
      onChange({ ...config, [axis]: Math.round(value) });
    },
    [config, onChange]
  );

  const presets = [
    { label: "正面", x: 0, y: 90, z: 0 },
    { label: "顶视", x: -90, y: 0, z: 0 },
    { label: "左视", x: 0, y: 180, z: 0 },
    { label: "45°", x: -30, y: 45, z: 0 },
  ];

  return (
    <>
      {/* Toggle — prominent button on the LEFT side */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-4 bottom-24 z-30 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:-translate-y-1 shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
          border: `1px solid ${accent}`,
          color: "#fff",
          backdropFilter: "blur(20px)",
          boxShadow: `0 0 24px ${accent}44`,
        }}
      >
        ⚙️ 调整朝向
      </button>

      {/* Panel overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className="fixed left-4 bottom-40 z-50 p-6 rounded-2xl w-80 animate__animated animate__fadeInUp shadow-2xl"
            style={{
              background: bg,
              border: `1px solid ${accent}44`,
              backdropFilter: "blur(24px)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-base font-bold" style={{ color: accent2 }}>
                🔧 场景朝向
              </h4>
              <button
                onClick={onReset}
                className="text-xs px-3 py-1.5 rounded-lg transition-all hover:-translate-y-0.5"
                style={{
                  background: `${accent}18`,
                  border: `1px solid ${accent}33`,
                  color: accent2,
                }}
              >
                重置默认
              </button>
            </div>

            {/* X */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span style={{ color: accent2 }}>↔ X 轴</span>
                <span className="text-white font-mono">{config.x}°</span>
              </div>
              <input
                type="range" min={-180} max={180} step={1}
                value={config.x}
                onChange={(e) => update("x", parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: accent }}
              />
            </div>

            {/* Y */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span style={{ color: accent2 }}>↕ Y 轴</span>
                <span className="text-white font-mono">{config.y}°</span>
              </div>
              <input
                type="range" min={-180} max={180} step={1}
                value={config.y}
                onChange={(e) => update("y", parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: accent }}
              />
            </div>

            {/* Z */}
            <div className="mb-5">
              <div className="flex justify-between text-sm mb-1.5">
                <span style={{ color: accent2 }}>↻ Z 轴</span>
                <span className="text-white font-mono">{config.z}°</span>
              </div>
              <input
                type="range" min={-180} max={180} step={1}
                value={config.z}
                onChange={(e) => update("z", parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: accent }}
              />
            </div>

            {/* Presets */}
            <div className="pt-4 border-t" style={{ borderColor: `${accent}33` }}>
              <p className="text-xs text-[#6a6255] mb-2.5">快速预设</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => onChange({ x: p.x, y: p.y, z: p.z })}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:-translate-y-0.5"
                    style={{
                      background: `${accent}15`,
                      border: `1px solid ${accent}33`,
                      color: accent2,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-[#6a6255] mt-4 text-center">
              自动保存 · {sceneId}
            </p>
          </div>
        </>
      )}
    </>
  );
}
