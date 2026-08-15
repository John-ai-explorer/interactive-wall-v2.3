"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/experience/")) return null;

  return (
    <footer
      className="border-t border-[rgba(214,168,79,0.1)] py-8 px-6 text-center"
      style={{ background: "rgba(8, 14, 26, 0.95)" }}
    >
      <div className="max-w-7xl mx-auto">
        <p className="text-[#B9B1A2] text-sm">
          科学家精神文化长廊数字化扫描与交互平台 — 墙面智扫进入故事沉浸体验
        </p>
        <p className="text-[#6a6255] text-xs mt-2">
          Demo Version V2.0 · 两故事 · 四交互 · 精神印记
        </p>
      </div>
    </footer>
  );
}
