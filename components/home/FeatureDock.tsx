"use client";

import Link from "next/link";
import { EASING, DURATION } from "@/lib/motion";

const FEATURES = [
  {
    href: "/scan",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
    title: "拍照识别",
    desc: "拍摄文化墙，即刻进入科学家故事",
  },
  {
    href: "/event/qian_xuesen_001",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
    title: "3D 故事",
    desc: "沉浸式三维叙事空间，滚轮推进故事",
  },
  {
    href: "/qa",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    title: "知识问答",
    desc: "探索科学家精神知识库，获取深度解读",
  },
  {
    href: "/generate",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
        <line x1="12" y1="22" x2="12" y2="15.5" />
        <polyline points="22 8.5 12 15.5 2 8.5" />
      </svg>
    ),
    title: "趣味生图",
    desc: "选择关键词，生成科学家精神主题视觉",
  },
  {
    href: "/news",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: "每周播报",
    desc: "每周科学家精神主题新闻与播报",
  },
];

export default function FeatureDock() {
  return (
    <section className="relative z-10 py-16 px-6 mx-auto" style={{ maxWidth: "min(80rem, 100vh)" }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="group block p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(214, 168, 79, 0.18)",
              backdropFilter: "blur(16px)",
              transitionTimingFunction: EASING,
              transitionDuration: `${DURATION.cardEnter}ms`,
            }}
          >
            <div className="text-[#D6A84F] group-hover:text-[#C32828] transition-colors duration-300 mb-3">
              {f.icon}
            </div>
            <h3 className="text-[#F7F2E8] font-semibold mb-1.5">{f.title}</h3>
            <p className="text-[#B9B1A2] text-sm leading-relaxed">{f.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
