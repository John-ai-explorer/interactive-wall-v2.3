"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ScanVisualState, RecognizeResult } from "@/lib/types";
import { recognizeImage } from "@/lib/api";
import { resolveStoryId } from "@/lib/stories";
import CameraUploadPanel from "@/components/scan/CameraUploadPanel";
import ImagePreviewFrame from "@/components/scan/ImagePreviewFrame";
import RecognizeResultCard from "@/components/scan/RecognizeResultCard";
import ScanTransitionCanvas from "@/components/experience/canvas/ScanTransitionCanvas";

export default function ScanPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const imageUrl = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);
  const [state, setState] = useState<ScanVisualState>("idle");
  const [result, setResult] = useState<RecognizeResult | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const recognizingRef = useRef(false);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!imageUrl) return;
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  const handleImageSelected = useCallback(async (selectedFile: File) => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    setFile(selectedFile);
    setState("preview");
    setResult(null);
    setTransitioning(false);

    previewTimerRef.current = setTimeout(async () => {
      if (recognizingRef.current) return;
      recognizingRef.current = true;
      setState("scanning");

      try {
        const res = await recognizeImage(selectedFile);
        setResult(res);
        if (res.matched) {
          setState("matched");
          transitionTimerRef.current = setTimeout(() => {
            setTransitioning(true);
          }, 450);
        } else {
          setState("failed");
        }
      } catch {
        setState("failed");
        setResult({
          matched: false,
          event_id: "",
          confidence: 0,
          title: "未识别到匹配故事",
          reason: "识别服务暂时不可用，请重新拍摄文化墙中的人物、事件、文字或图像主体。",
          tags: [],
        });
      } finally {
        recognizingRef.current = false;
      }
    }, 800);
  }, []);

  const handleReset = useCallback(() => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    setFile(null);
    setState("idle");
    setResult(null);
    setTransitioning(false);
    recognizingRef.current = false;
  }, []);

  const handleTransitionDone = useCallback(() => {
    const storyId = resolveStoryId(result?.story_id || result?.event_id || "qian-xuesen");
    router.push(`/experience/${storyId}?from=scan`);
  }, [result, router]);

  return (
    <>
      {transitioning && result && (
        <ScanTransitionCanvas
          imageUrl={imageUrl}
          title={result.title}
          onDone={handleTransitionDone}
        />
      )}
      <div className="min-h-[100dvh] px-6 pb-16 pt-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[#F7F2E8] mb-3 animate__animated animate__fadeInDown">
            拍照识别
          </h1>
          <p className="text-[#B9B1A2] mb-10 animate__animated animate__fadeIn">
            拍摄文化墙内容，即刻进入科学家精神故事
          </p>

          <div className="flex items-center justify-center gap-2 mb-10 text-sm">
            {["上传图片", "识别匹配", "进入故事"].map((label, i) => {
              const stepState: ScanVisualState[] = ["preview", "scanning", "matched"];
              const currentIdx = stepState.indexOf(state);
              const isDone = currentIdx > i;
              const isActive = currentIdx === i;

              return (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium ${
                      isDone
                        ? "bg-[#D6A84F] text-[#080E1A]"
                        : isActive
                        ? "bg-[#C32828] text-white"
                        : "bg-[rgba(255,255,255,0.08)] text-[#6a6255]"
                    }`}
                  >
                    {isDone ? "✓" : i + 1}
                  </span>
                  <span className={isActive ? "text-[#F7F2E8]" : "text-[#6a6255]"}>
                    {label}
                  </span>
                  {i < 2 && <span className="text-[#6a6255] mx-1">→</span>}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
            <div>
              {!file ? (
                <div className="flex flex-col items-center gap-6">
                  <CameraUploadPanel
                    onImageSelected={handleImageSelected}
                    disabled={state === "scanning"}
                  />
                  <div className="glass-card p-4 max-w-sm">
                    <img
                      src="/assets/ui/v2/scan_guide_v2.png"
                      alt="拍照引导"
                      className="w-full rounded-lg opacity-80"
                    />
                    <p className="text-[#6a6255] text-xs mt-3 text-center">
                      提示：尽量拍清人物、事件标题、关键词或图像主体，识别会更稳。
                    </p>
                  </div>
                </div>
              ) : (
                <ImagePreviewFrame file={file} state={state} />
              )}
            </div>

            {result && state === "matched" && (
              <RecognizeResultCard result={result} onReset={handleReset} />
            )}

            {state === "failed" && (
              <div
                className="animate__animated animate__shakeX p-6 rounded-xl max-w-xs"
                style={{
                  background: "rgba(139, 30, 30, 0.15)",
                  border: "1px solid rgba(139, 30, 30, 0.3)",
                }}
              >
                <img
                  src="/assets/ui/v2/scan_retry.png"
                  alt="重新拍摄提示"
                  className="mx-auto mb-4 aspect-square w-32 rounded-xl object-cover opacity-80"
                />
                <p className="text-[#C32828] font-medium mb-3">
                  {result?.reason?.includes("没有相关主题") ? "没有相关主题" : "识别失败"}
                </p>
                <p className="text-[#B9B1A2] text-sm mb-4">
                  {result?.reason ||
                    "请重新拍摄文化墙中的人物、事件、文字或图像主体，尽量让主体更清晰。"}
                </p>
                <button onClick={handleReset} className="btn-outline px-4 py-2 rounded-xl text-sm">
                  返回拍照
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
