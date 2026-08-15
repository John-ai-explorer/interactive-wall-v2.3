"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const HeroThreeScene = dynamic(
  () => import("@/components/three/HeroThreeScene"),
  { ssr: false }
);

export default function HeroSection() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* ======= LAYERED 3D: particles(full-screen) + globe(centered square) ======= */}
      <HeroThreeScene />

      {/* ======= TITLE + BUTTONS OVERLAY ======= */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-center animate__animated animate__fadeIn px-4">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-wider leading-tight mb-6">
            <span className="text-[#F7F2E8] drop-shadow-[0_0_40px_rgba(0,0,0,0.8)]">
              科学家精神
            </span>
            <br />
            <span className="text-[#D6A84F] drop-shadow-[0_0_40px_rgba(0,0,0,0.8)]">
              文化墙智能交互系统
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-[#B9B1A2] max-w-2xl mx-auto leading-relaxed mb-12 drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]">
            让静态文化墙成为可探索、可聆听、可互动的精神学习空间
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 pointer-events-auto">
          <Link
            href="/scan"
            className="inline-flex items-center justify-center px-10 py-5 rounded-2xl text-xl font-semibold transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #8B1E1E, #C32828)",
              boxShadow: "0 0 40px rgba(195, 40, 40, 0.35)",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            开始拍照识别
          </Link>
          <Link
            href="/event/qian_xuesen_001"
            className="inline-flex items-center justify-center px-10 py-5 rounded-2xl text-xl font-semibold transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.98]"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(214, 168, 79, 0.35)",
              color: "#D6A84F",
              backdropFilter: "blur(12px)",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            浏览科学家故事
          </Link>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(8,14,26,0.95), transparent)" }} />
    </section>
  );
}
