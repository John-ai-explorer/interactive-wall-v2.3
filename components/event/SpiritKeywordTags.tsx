"use client";

type Props = {
  keywords: string[];
};

export default function SpiritKeywordTags({ keywords }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((kw, i) => (
        <span
          key={kw}
          className="animate__animated animate__fadeInUp px-3 py-1 rounded-full text-xs font-medium border transition-all duration-300"
          style={{
            animationDelay: `${i * 60}ms`,
            background: "rgba(214, 168, 79, 0.08)",
            borderColor: "rgba(214, 168, 79, 0.3)",
            color: "#D6A84F",
          }}
        >
          {kw}
        </span>
      ))}
    </div>
  );
}
