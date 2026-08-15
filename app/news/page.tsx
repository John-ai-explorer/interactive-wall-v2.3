"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { WeeklyNews } from "@/lib/types";
import { fetchWeeklyNews } from "@/lib/api";

const CanvasAmbientBackground = dynamic(
  () => import("@/components/canvas/CanvasAmbientBackground"),
  { ssr: false }
);

const CanvasBroadcastWave = dynamic(
  () => import("@/components/canvas/CanvasBroadcastWave"),
  { ssr: false }
);

const NewsMarquee = dynamic(
  () => import("@/components/home/NewsMarquee"),
  { ssr: false }
);

export default function NewsPage() {
  const [news, setNews] = useState<WeeklyNews | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    fetchWeeklyNews().then(setNews);
  }, []);

  return (
    <>
      <CanvasAmbientBackground particleCount={50} />
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-[#F7F2E8] mb-3 text-center animate__animated animate__fadeInDown">
            每周新闻播报
          </h1>
          <p className="text-[#B9B1A2] mb-10 text-center">
            每周科学家精神主题新闻与播报 · 数据来自新华网、人民网、科技日报等官方渠道
          </p>

          {/* Hero banner with audio player */}
          {news && (
            <div
              className="relative rounded-2xl overflow-hidden mb-8 animate__animated animate__fadeInUp"
              style={{
                border: "1px solid rgba(214, 168, 79, 0.18)",
              }}
            >
              {/* Banner image background */}
              <div className="absolute inset-0">
                <img
                  src="/assets/news/week_2026_27_banner.png"
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[rgba(8,14,26,0.92)] via-[rgba(8,14,26,0.7)] to-[rgba(8,14,26,0.5)]" />
              </div>
              <div className="relative p-8 md:p-12">
                <span className="text-xs text-[#D6A84F] uppercase tracking-widest">
                  {news.week} · 每周主题
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-[#F7F2E8] mt-2 mb-4">
                  {news.theme}
                </h2>

                {/* Broadcast wave */}
                <div
                  className="mb-6 rounded-lg overflow-hidden"
                  style={{ background: "rgba(8, 14, 26, 0.4)" }}
                >
                  <CanvasBroadcastWave playing={playing} />
                </div>

                {/* Audio controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setPlaying(!playing)}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105"
                    style={{
                      background: playing
                        ? "rgba(195, 40, 40, 0.8)"
                        : "rgba(214, 168, 79, 0.15)",
                      border: `1px solid ${playing ? "#C32828" : "rgba(214, 168, 79, 0.3)"}`,
                    }}
                  >
                    {playing ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7F2E8" strokeWidth="2">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D6A84F" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    )}
                  </button>
                  <div>
                    <p className="text-[#F7F2E8] font-medium text-sm">
                      {playing ? "正在播报" : "点击播放"}
                    </p>
                    <p className="text-[#6a6255] text-xs">
                      科学家精神主题播报
                    </p>
                  </div>
                  {news.updatedAt && (
                    <div className="ml-auto text-[10px] text-[#6a6255]">
                      更新于 {formatUpdateTime(news.updatedAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================ */}
          {/* 🆕 News Marquee — left-to-right circling news flow */}
          {/* ================================================ */}
          <NewsMarquee />

          {/* News cards grid */}
          {news && news.items.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#F7F2E8] flex items-center gap-2">
                  <span className="text-[#D6A84F]">▎</span>全部新闻
                </h2>
                {news.dbStats && (
                  <span className="text-[10px] text-[#6a6255]">
                    数据库: {news.dbStats.total}/{news.dbStats.maxCapacity} 条 · 经典 {news.dbStats.starred} 条
                  </span>
                )}
              </div>
              {news.items.map((item, i) => (
                <a
                  key={i}
                  href={item.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-5 block animate__animated animate__fadeInUp transition-all duration-300 hover:-translate-y-0.5 group"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    {item.image && (
                      <div className="flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{
                            background: "rgba(195, 40, 40, 0.15)",
                            color: "#C32828",
                          }}
                        >
                          {item.source}
                        </span>
                        {item.stars > 0 && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                            style={{
                              background: item.stars >= 4
                                ? "rgba(232, 168, 40, 0.2)"
                                : "rgba(214, 168, 79, 0.1)",
                              color: item.stars >= 4 ? "#E8A840" : "#D6A84F",
                            }}
                            title={`${"★".repeat(item.stars)} 重要性 ${item.stars}/5`}
                          >
                            {"★".repeat(item.stars)}
                          </span>
                        )}
                        <span className="text-[10px] text-[#6a6255]">
                          {formatRelativeTime(item.publishedAt)}
                        </span>
                      </div>
                      <h3 className="text-[#F7F2E8] font-semibold mb-1 group-hover:text-[#D6A84F] transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-[#B9B1A2] text-sm leading-relaxed line-clamp-2">
                        {item.summary}
                      </p>
                    </div>
                    {/* Arrow */}
                    <div className="flex-shrink-0 flex items-center text-[#6a6255] group-hover:text-[#D6A84F] group-hover:translate-x-1 transition-all duration-300">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {!news && (
            <div className="text-center py-12">
              <div className="animate__animated animate__pulse text-[#D6A84F]">
                加载中...
              </div>
            </div>
          )}
        </div>
      </div>
    </>
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

function formatUpdateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
