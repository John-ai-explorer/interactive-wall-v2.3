"use client";

import Link from "next/link";
import scenesData from "@/data/scenes.json";
import { EASING, DURATION } from "@/lib/motion";

export default function SceneExplorationCards() {
  return (
    <section className="relative z-10 pt-6 pb-12 px-6 mx-auto" style={{ maxWidth: "min(80rem, 100vh)" }}>
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-[#F7F2E8] mb-2">
          3D 实景探索
        </h2>
        <p className="text-[#B9B1A2] text-sm">
          进入真实三维场景，亲历科学家精神的伟大时刻
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scenesData.scenes.map((scene, i) => (
          <Link
            key={scene.scene_id}
            href={`/scene/${scene.scene_id}`}
            className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(214, 168, 79, 0.15)",
              backdropFilter: "blur(16px)",
              transitionTimingFunction: EASING,
              minHeight: 280,
            }}
          >
            {/* Background gradient */}
            <div
              className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-80"
              style={{
                background:
                  i === 0
                    ? "radial-gradient(ellipse at 30% 50%, rgba(139,30,30,0.35) 0%, transparent 70%), radial-gradient(ellipse at 70% 30%, rgba(214,168,79,0.15) 0%, transparent 60%)"
                    : "radial-gradient(ellipse at 30% 50%, rgba(195,40,40,0.3) 0%, transparent 70%), radial-gradient(ellipse at 70% 30%, rgba(232,168,64,0.2) 0%, transparent 60%)",
              }}
            />

            {/* 3D icon decoration */}
            <div className="absolute top-6 right-6 opacity-30 group-hover:opacity-60 transition-opacity duration-500">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#D6A84F" strokeWidth="0.8">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>

            {/* Content */}
            <div className="relative p-8 flex flex-col h-full min-h-[280px]">
              {/* Keywords */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {scene.spirit_keywords.slice(0, 3).map((kw) => (
                  <span
                    key={kw}
                    className="px-2.5 py-0.5 rounded-full text-xs"
                    style={{
                      background: "rgba(214, 168, 79, 0.1)",
                      border: "1px solid rgba(214, 168, 79, 0.2)",
                      color: "#D6A84F",
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-[#F7F2E8] mb-2 group-hover:text-[#D6A84F] transition-colors duration-300">
                {scene.title}
              </h3>
              <p className="text-sm text-[#D6A84F] mb-3">{scene.subtitle}</p>
              <p className="text-[#B9B1A2] text-sm leading-relaxed line-clamp-3 flex-1">
                {scene.description}
              </p>

              {/* CTA */}
              <div className="mt-6 flex items-center gap-2 text-sm font-medium"
                style={{ color: "#D6A84F" }}>
                <span className="group-hover:translate-x-1 transition-transform duration-300">
                  进入3D场景探索
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className="group-hover:translate-x-1 transition-transform duration-300">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>

            {/* Story node count badge */}
            <div className="absolute bottom-6 right-6 px-3 py-1 rounded-full text-xs"
              style={{
                background: "rgba(8, 14, 26, 0.7)",
                border: "1px solid rgba(214, 168, 79, 0.2)",
                color: "#B9B1A2",
              }}>
              {scene.story_nodes.length} 个故事节点
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
