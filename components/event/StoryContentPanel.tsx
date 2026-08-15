"use client";

import type { TimelineNode } from "@/lib/types";
import SpiritKeywordTags from "./SpiritKeywordTags";

type Props = {
  node: TimelineNode;
  spiritKeywords: string[];
};

export default function StoryContentPanel({ node, spiritKeywords }: Props) {
  return (
    <div
      className="animate__animated animate__fadeInUp p-6 rounded-2xl h-full overflow-y-auto"
      style={{
        background: "rgba(255, 255, 255, 0.06)",
        border: "1px solid rgba(214, 168, 79, 0.18)",
        backdropFilter: "blur(16px)",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Node title */}
      <div className="mb-4">
        <span className="text-xs text-[#D6A84F] uppercase tracking-wider">
          {node.id.replace("node_", "节点 ")}
        </span>
        <h3 className="text-xl font-bold text-[#F7F2E8] mt-1">
          {node.title}
        </h3>
        {node.subtitle && (
          <p className="text-sm text-[#B9B1A2] mt-0.5">{node.subtitle}</p>
        )}
      </div>

      {/* Text */}
      <p className="text-[#B9B1A2] leading-relaxed mb-6">{node.text}</p>

      {/* Keywords */}
      <SpiritKeywordTags keywords={spiritKeywords} />

      {/* Media content */}
      <div className="mt-6 space-y-3">
        {/* Thumbnail image if available */}
        {node.thumbnail && (
          <div className="rounded-lg overflow-hidden"
            style={{ border: "1px solid rgba(214, 168, 79, 0.15)" }}>
            <img
              src={node.thumbnail}
              alt={node.title}
              className="w-full object-cover aspect-video"
            />
          </div>
        )}

        {/* Video placeholder */}
        <div
          className="aspect-video rounded-lg flex items-center justify-center"
          style={{ background: "rgba(8, 14, 26, 0.5)" }}
        >
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2"
              style={{ background: "rgba(195, 40, 40, 0.2)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C32828" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <span className="text-[#6a6255] text-xs">视频讲解</span>
          </div>
        </div>

        {/* Audio button placeholder */}
        <button
          className="w-full py-2.5 rounded-lg text-sm text-[#D6A84F] transition-all duration-300 hover:bg-[rgba(214,168,79,0.08)]"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(214, 168, 79, 0.2)",
          }}
        >
          🔊 播放语音讲解
        </button>
      </div>
    </div>
  );
}
