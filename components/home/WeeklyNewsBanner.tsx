"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { WeeklyNews } from "@/lib/types";
import { fetchWeeklyNews } from "@/lib/api";

export default function WeeklyNewsBanner() {
  const [news, setNews] = useState<WeeklyNews | null>(null);

  useEffect(() => {
    fetchWeeklyNews().then(setNews);
  }, []);

  if (!news) return null;

  const latestItem = news.items[0];

  return (
    <section className="relative z-10 py-12 px-6 mx-auto" style={{ maxWidth: "min(80rem, 100vh)" }}>
      <Link
        href="/news"
        className="block relative rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-1"
        style={{
          border: "1px solid rgba(214, 168, 79, 0.18)",
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Banner bg */}
        <div className="absolute inset-0">
          <img
            src="/assets/news/week_2026_27_banner.png"
            alt=""
            className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(8,14,26,0.95)] via-[rgba(8,14,26,0.7)] to-[rgba(8,14,26,0.4)]" />
        </div>

        {/* Content */}
        <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Week badge */}
          <div className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium"
            style={{
              background: "rgba(195, 40, 40, 0.2)",
              border: "1px solid rgba(195, 40, 40, 0.3)",
              color: "#C32828",
            }}>
            📡 {news.week}
          </div>

          {/* Info */}
          <div className="flex-1">
            <p className="text-xs text-[#D6A84F] uppercase tracking-widest mb-1">
              每周主题播报 · 来自官方渠道
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-[#F7F2E8] group-hover:text-[#D6A84F] transition-colors duration-300">
              {news.theme}
            </h3>
            {latestItem && (
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(214, 168, 79, 0.12)",
                    color: "#D6A84F",
                  }}
                >
                  {latestItem.source}
                </span>
                <p className="text-[#B9B1A2] text-sm line-clamp-1">
                  {latestItem.title}
                </p>
              </div>
            )}
            {news.updatedAt && (
              <p className="text-[10px] text-[#6a6255] mt-1">
                更新于{" "}
                {new Date(news.updatedAt).toLocaleDateString("zh-CN", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 text-[#D6A84F] group-hover:translate-x-1 transition-transform duration-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </Link>
    </section>
  );
}
