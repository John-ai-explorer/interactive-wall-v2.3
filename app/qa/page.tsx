"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { askQuestion, getRecommendedQuestions } from "@/lib/api";

const CanvasAmbientBackground = dynamic(
  () => import("@/components/canvas/CanvasAmbientBackground"),
  { ssr: false }
);

const CanvasKnowledgeNetwork = dynamic(
  () => import("@/components/canvas/CanvasKnowledgeNetwork"),
  { ssr: false }
);

export default function QAPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [relatedEvents, setRelatedEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasAsked, setHasAsked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const recommended = getRecommendedQuestions();

  const handleSubmit = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed || loading) return;
      setLoading(true);
      setHasAsked(true);
      setAnswer("");
      setRelatedEvents([]);

      try {
        const res = await askQuestion(trimmed);
        setAnswer(res.answer);
        setRelatedEvents(res.related_events);
      } catch {
        setAnswer("抱歉，知识库暂时无法响应，请稍后再试。");
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSubmit(question);
    },
    [handleSubmit, question]
  );

  return (
    <>
      <CanvasAmbientBackground particleCount={60} />
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-[#F7F2E8] mb-3 text-center animate__animated animate__fadeInDown">
            知识问答
          </h1>
          <p className="text-[#B9B1A2] mb-10 text-center">
            探索科学家精神知识库，获取深度解读
          </p>

          {/* Knowledge Network + Illustration */}
          <div className="relative rounded-2xl overflow-hidden mb-8"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(214, 168, 79, 0.12)",
              minHeight: 200,
            }}>
            <CanvasKnowledgeNetwork active={loading} pulse={hasAsked} />
            {/* QA illustration overlay */}
            <div className="absolute right-4 bottom-0 w-32 md:w-40 opacity-40 pointer-events-none">
              <img
                src="/assets/ui/qa_illustration.png"
                alt="知识问答"
                className="w-full object-contain"
              />
            </div>
          </div>

          {/* Input area */}
          <div className="glass-card p-6 mb-6 animate__animated animate__fadeInUp">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入您关于科学家精神的问题..."
                className="flex-1 px-4 py-3 rounded-xl text-[#F7F2E8] placeholder-[#6a6255] outline-none border border-[rgba(214,168,79,0.2)] focus:border-[rgba(214,168,79,0.5)] transition-colors"
                style={{ background: "rgba(8, 14, 26, 0.5)" }}
              />
              <button
                onClick={() => handleSubmit(question)}
                disabled={loading || !question.trim()}
                className="btn-primary px-6 py-3 rounded-xl font-medium disabled:opacity-40"
              >
                {loading ? "思考中..." : "提问"}
              </button>
            </div>

            {/* Voice button placeholder */}
            <button className="mt-3 flex items-center gap-2 text-sm text-[#6a6255] hover:text-[#D6A84F] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              语音输入（即将支持）
            </button>
          </div>

          {/* Recommended questions */}
          {!hasAsked && (
            <div className="mb-6 animate__animated animate__fadeIn">
              <p className="text-sm text-[#6a6255] mb-3">推荐问题：</p>
              <div className="flex flex-wrap gap-2">
                {recommended.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSubmit(q)}
                    className="px-4 py-2 rounded-full text-sm transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(214, 168, 79, 0.2)",
                      color: "#B9B1A2",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Answer */}
          {hasAsked && (
            <div className="animate__animated animate__fadeInUp glass-card p-6 mb-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate__animated animate__pulse text-[#D6A84F]">
                    正在检索知识库...
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-[#D6A84F] font-semibold mb-3">
                    回答
                  </h3>
                  <p className="text-[#B9B1A2] leading-relaxed whitespace-pre-line">
                    {answer}
                  </p>

                  {relatedEvents.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-[rgba(214,168,79,0.12)]">
                      <p className="text-sm text-[#6a6255] mb-2">
                        相关事件：
                      </p>
                      {relatedEvents.map((evtId) => (
                        <Link
                          key={evtId}
                          href={`/event/${evtId}`}
                          className="inline-flex items-center gap-1 text-sm text-[#D6A84F] hover:text-[#C32828] transition-colors"
                        >
                          查看详情 →
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
