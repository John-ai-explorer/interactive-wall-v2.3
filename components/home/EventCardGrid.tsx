"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { EventItem } from "@/lib/types";
import { fetchAllEvents } from "@/lib/api";
import { EASING } from "@/lib/motion";

export default function EventCardGrid() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    fetchAllEvents().then(setEvents);
  }, []);

  if (events.length === 0) return null;

  return (
    <section className="relative z-10 py-12 px-6 mx-auto" style={{ maxWidth: "min(80rem, 100vh)" }}>
      <h2 className="text-2xl font-bold text-[#F7F2E8] mb-8 text-center">
        探索科学家故事
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event, i) => (
          <Link
            key={event.event_id}
            href={`/event/${event.event_id}`}
            className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(214, 168, 79, 0.18)",
              backdropFilter: "blur(16px)",
              transitionTimingFunction: EASING,
            }}
          >
            {/* Cover image */}
            <div className="aspect-[16/9] bg-[#120608] overflow-hidden">
              <img
                src={event.cover_image}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Info */}
            <div className="p-5">
              <div className="flex flex-wrap gap-2 mb-3">
                {event.spirit_keywords.slice(0, 3).map((kw) => (
                  <span
                    key={kw}
                    className="text-xs px-2 py-0.5 rounded-full border border-[rgba(214,168,79,0.3)] text-[#D6A84F]"
                  >
                    {kw}
                  </span>
                ))}
              </div>
              <h3 className="text-[#F7F2E8] font-semibold mb-1">
                {event.title}
              </h3>
              <p className="text-[#B9B1A2] text-sm">{event.scientist}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
