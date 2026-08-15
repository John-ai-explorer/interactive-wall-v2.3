"use client";

import { useEffect, useState, useRef } from "react";
import type { NewsItem } from "@/lib/types";
import { fetchWeeklyNews } from "@/lib/api";

// ============================================================
// NewsMarquee — 新闻从左到右循环流动
// 位于页面主窗口下方，玻璃卡片承载每条新闻的封面图与标题
// 鼠标悬停暂停滚动，点击可跳转新闻原始链接
// ============================================================

export default function NewsMarquee() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWeeklyNews().then((data) => {
      if (data.items.length > 0) {
        setItems(data.items);
      }
    });
  }, []);

  // Don't render if no items
  if (items.length === 0) {
    return (
      <section className="relative z-10 py-4 px-6 mx-auto" style={{ maxWidth: "min(80rem, 100vh)" }}>
        <div className="text-center text-[#6a6255] text-sm animate__animated animate__pulse">
          📡 正在加载官方新闻...
        </div>
      </section>
    );
  }

  // Duplicate items for seamless looping
  const duplicated = [...items, ...items];

  return (
    <section
      className="relative z-10 py-8 px-4 mx-auto"
      style={{ maxWidth: "min(84rem, 100vw)" }}
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4 px-2">
        <div
          className="w-1 h-5 rounded-full"
          style={{ background: "linear-gradient(180deg, #C32828, #D6A84F)" }}
        />
        <h2 className="text-lg font-bold text-[#F7F2E8] tracking-wide">
          📡 官方新闻速递
        </h2>
        <span className="text-xs text-[#6a6255] ml-auto">
          来自新华网 · 人民网 · 科技日报等官方渠道
        </span>
      </div>

      {/* Marquee window — the "window" the user mentioned */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: "rgba(8, 14, 26, 0.7)",
          border: "1px solid rgba(214, 168, 79, 0.2)",
          backdropFilter: "blur(12px)",
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Gradient fade edges — smooth entry/exit */}
        <div
          className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
          style={{
            width: 48,
            background: "linear-gradient(to right, rgba(8,14,26,0.9), transparent)",
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none"
          style={{
            width: 48,
            background: "linear-gradient(to left, rgba(8,14,26,0.9), transparent)",
          }}
        />

        {/* Scrolling track */}
        <div
          ref={trackRef}
          className="flex py-4"
          style={{
            animation: `marqueeScroll ${items.length * 6}s linear infinite`,
            animationPlayState: isPaused ? "paused" : "running",
            width: "fit-content",
          }}
        >
          {duplicated.map((item, i) => (
            <a
              key={`${i}-${item.title.slice(0, 8)}`}
              href={item.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-72 mx-3 group cursor-pointer"
              title={item.title}
            >
              {/* News card */}
              <div
                className="rounded-xl overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(214, 168, 79, 0.15)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                }}
              >
                {/* Cover image */}
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={item.image || "/assets/news/week_2026_27_banner.png"}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Source badge */}
                  <span
                    className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium"
                    style={{
                      background: "rgba(195, 40, 40, 0.75)",
                      color: "#F7F2E8",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {item.source}
                  </span>
                  {/* Star badge — only for starred items */}
                  {item.stars > 0 && (
                    <span
                      className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5"
                      style={{
                        background: item.stars >= 4
                          ? "rgba(232, 168, 40, 0.85)"
                          : "rgba(214, 168, 79, 0.5)",
                        color: item.stars >= 4 ? "#080E1A" : "#F7F2E8",
                        backdropFilter: "blur(4px)",
                      }}
                      title={`${"★".repeat(item.stars)} 重要性 ${item.stars}/5`}
                    >
                      {"★".repeat(Math.min(item.stars, 5))}
                    </span>
                  )}
                </div>

                {/* Title */}
                <div className="p-3">
                  <p
                    className="text-sm font-medium leading-snug line-clamp-2 transition-colors duration-300"
                    style={{ color: "#F7F2E8" }}
                  >
                    {item.title}
                  </p>
                  <p className="text-[10px] text-[#6a6255] mt-1.5">
                    {formatRelativeTime(item.publishedAt)}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Inline keyframe definition */}
      <style jsx>{`
        @keyframes marqueeScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}

// ============================================================
// Helpers
// ============================================================

function formatRelativeTime(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}
