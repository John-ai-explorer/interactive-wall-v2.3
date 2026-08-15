"use client";

import type { EventItem } from "@/lib/types";

type Props = {
  event: EventItem;
};

export default function EventHeader({ event }: Props) {
  return (
    <div className="text-center mb-8 animate__animated animate__fadeInDown">
      <h1 className="text-3xl md:text-4xl font-bold text-[#F7F2E8] mb-2">
        {event.title}
      </h1>
      <p className="text-[#D6A84F] text-lg font-medium">{event.scientist}</p>
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {event.spirit_keywords.map((kw) => (
          <span
            key={kw}
            className="px-3 py-1 rounded-full text-xs border border-[rgba(214,168,79,0.3)] text-[#D6A84F]"
            style={{ background: "rgba(214,168,79,0.06)" }}
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}
