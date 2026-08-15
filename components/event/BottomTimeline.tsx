"use client";

import type { TimelineNode } from "@/lib/types";

type Props = {
  nodes: TimelineNode[];
  progress: number;
  currentNodeId: string;
  onNodeClick: (node: TimelineNode) => void;
};

export default function BottomTimeline({
  nodes,
  progress,
  currentNodeId,
  onNodeClick,
}: Props) {
  return (
    <div className="w-full px-4 py-6">
      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full mb-4"
        style={{ background: "rgba(255, 255, 255, 0.08)" }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress * 100}%`,
            background: "linear-gradient(90deg, #8B1E1E, #C32828, #D6A84F)",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>

      {/* Node dots + labels */}
      <div className="relative flex items-start justify-between">
        {/* Connection line */}
        <div className="absolute top-2.5 left-0 right-0 h-px"
          style={{ background: "rgba(214, 168, 79, 0.2)" }} />

        {nodes.map((node) => {
          const isCurrent = node.id === currentNodeId;
          const isVisited = node.progress <= progress;

          return (
            <button
              key={node.id}
              onClick={() => onNodeClick(node)}
              className="relative flex flex-col items-center gap-2 group"
              style={{ flex: 1 }}
            >
              {/* Dot */}
              <span
                className={`block rounded-full transition-all duration-300 ${
                  isCurrent
                    ? "w-6 h-6 ring-4 ring-[rgba(195,40,40,0.3)]"
                    : isVisited
                    ? "w-5 h-5 ring-2 ring-[rgba(214,168,79,0.2)]"
                    : "w-5 h-5"
                }`}
                style={{
                  background: isCurrent
                    ? "#C32828"
                    : isVisited
                    ? "#D6A84F"
                    : "rgba(255, 255, 255, 0.15)",
                }}
              />

              {/* Label */}
              <span
                className={`text-xs text-center leading-tight transition-colors duration-300 ${
                  isCurrent
                    ? "text-[#F7F2E8] font-medium"
                    : isVisited
                    ? "text-[#D6A84F]"
                    : "text-[#6a6255]"
                }`}
              >
                {node.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
