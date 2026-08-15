"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { generateImage } from "@/lib/api";

const CanvasAmbientBackground = dynamic(
  () => import("@/components/canvas/CanvasAmbientBackground"),
  { ssr: false }
);

const CanvasPromptAura = dynamic(
  () => import("@/components/canvas/CanvasPromptAura"),
  { ssr: false }
);

const SCIENTISTS = [
  { id: "qian_xuesen", name: "钱学森", label: "钱学森" },
  { id: "deng_jiaxian", name: "邓稼先", label: "邓稼先" },
  { id: "yu_min", name: "于敏", label: "于敏" },
];

const STYLES = [
  {
    id: "space",
    label: "航天科技风",
    description: "星空、火箭、未来感",
  },
  {
    id: "lab",
    label: "实验室科研风",
    description: "仪器、数据、严谨感",
  },
  {
    id: "ink",
    label: "水墨中国风",
    description: "传统、诗意、文化感",
  },
  {
    id: "modern",
    label: "现代简约风",
    description: "简洁、高级、设计感",
  },
];

const THEMES = [
  "科学报国",
  "自主创新",
  "团结协作",
  "无私奉献",
  "青年担当",
];

export default function GeneratePage() {
  const [scientist, setScientist] = useState("");
  const [style, setStyle] = useState("");
  const [theme, setTheme] = useState("");
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const canGenerate = scientist && style && theme;

  const handleGenerate = useCallback(async () => {
    if (!canGenerate || generating) return;
    setGenerating(true);
    setResultUrl(null);

    try {
      const res = await generateImage({ scientist, style, theme });
      setResultUrl(res.image_url);
    } catch {
      // Silently fail
    } finally {
      setGenerating(false);
    }
  }, [scientist, style, theme, canGenerate, generating]);

  return (
    <>
      <CanvasAmbientBackground particleCount={50} />
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-[#F7F2E8] mb-3 text-center animate__animated animate__fadeInDown">
            趣味生图
          </h1>
          <p className="text-[#B9B1A2] mb-2 text-center">
            选择关键词，生成科学家精神主题视觉
          </p>
          <p className="text-[#6a6255] text-xs text-center mb-10">
            当前为演示模式，正式版将接入生成式模型
          </p>

          {/* Step 1: Scientist */}
          <div className="glass-card p-6 mb-6 animate__animated animate__fadeInUp">
            <h3 className="text-[#D6A84F] font-semibold mb-4">
              选择科学家
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SCIENTISTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setScientist(s.id)}
                  className={`p-4 rounded-xl text-center transition-all duration-300 hover:-translate-y-1 ${
                    scientist === s.id
                      ? "border-[#D6A84F] bg-[rgba(214,168,79,0.1)]"
                      : "border-[rgba(214,168,79,0.15)]"
                  }`}
                  style={{
                    background:
                      scientist === s.id
                        ? "rgba(214,168,79,0.08)"
                        : "rgba(255,255,255,0.03)",
                    border: "1px solid",
                    borderColor:
                      scientist === s.id
                        ? "#D6A84F"
                        : "rgba(214,168,79,0.15)",
                  }}
                >
                  <span className="text-[#F7F2E8] font-medium block">
                    {s.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Style */}
          <div className="glass-card p-6 mb-6 animate__animated animate__fadeInUp">
            <h3 className="text-[#D6A84F] font-semibold mb-4">
              选择风格
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`p-4 rounded-xl text-center transition-all duration-300 hover:-translate-y-1 ${
                    style === s.id
                      ? "border-[#D6A84F]"
                      : "border-[rgba(214,168,79,0.15)]"
                  }`}
                  style={{
                    background:
                      style === s.id
                        ? "rgba(214,168,79,0.08)"
                        : "rgba(255,255,255,0.03)",
                    border: "1px solid",
                    borderColor:
                      style === s.id
                        ? "#D6A84F"
                        : "rgba(214,168,79,0.15)",
                  }}
                >
                  <span className="text-[#F7F2E8] font-medium block text-sm">
                    {s.label}
                  </span>
                  <span className="text-[#6a6255] text-xs block mt-1">
                    {s.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Theme */}
          <div className="glass-card p-6 mb-8 animate__animated animate__fadeInUp">
            <h3 className="text-[#D6A84F] font-semibold mb-4">
              选择主题
            </h3>
            <div className="flex flex-wrap gap-3">
              {THEMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-5 py-2.5 rounded-xl text-sm transition-all duration-300 hover:-translate-y-0.5 ${
                    theme === t
                      ? "text-[#F7F2E8]"
                      : "text-[#B9B1A2]"
                  }`}
                  style={{
                    background:
                      theme === t
                        ? "rgba(195, 40, 40, 0.25)"
                        : "rgba(255, 255, 255, 0.06)",
                    border: "1px solid",
                    borderColor:
                      theme === t
                        ? "rgba(195, 40, 40, 0.4)"
                        : "rgba(214, 168, 79, 0.15)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <div className="text-center mb-10">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="btn-primary px-12 py-4 rounded-xl text-lg font-medium disabled:opacity-40"
            >
              {generating ? "生成中..." : "生成视觉"}
            </button>
          </div>

          {/* Result */}
          <div className="relative">
            {(generating || resultUrl) && (
              <div className="relative rounded-2xl overflow-hidden mx-auto max-w-lg min-h-[320px]"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(214, 168, 79, 0.15)",
                }}>
                <CanvasPromptAura active={generating} />

                {generating && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate__animated animate__pulse text-[#D6A84F] text-center">
                      <p className="text-lg">生成中...</p>
                      <p className="text-xs text-[#6a6255] mt-2">
                        提示词：科学家精神 · {scientist} · {style} · {theme}
                      </p>
                    </div>
                  </div>
                )}

                {resultUrl && !generating && (
                  <div className="animate__animated animate__fadeIn">
                    <img
                      src={resultUrl}
                      alt={`${scientist} - ${theme}`}
                      className="w-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-xs px-2 py-1 rounded-full"
                        style={{
                          background: "rgba(8, 14, 26, 0.7)",
                          color: "#B9B1A2",
                        }}>
                        演示模式 · 正式版将接入生成式模型
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
