"use client";

import { useEffect, useMemo } from "react";
import type { ScanVisualState } from "@/lib/types";
import CanvasScanOverlay from "@/components/canvas/CanvasScanOverlay";

type Props = {
  file: File;
  state: ScanVisualState;
};

export default function ImagePreviewFrame({ file, state }: Props) {
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const borderColor =
    state === "matched"
      ? "rgba(214, 168, 79, 0.6)"
      : state === "failed"
      ? "rgba(139, 30, 30, 0.6)"
      : "rgba(214, 168, 79, 0.3)";

  return (
    <div
      className="relative mx-auto rounded-xl overflow-hidden"
      style={{
        width: 360,
        height: 480,
        border: `2px solid ${borderColor}`,
        boxShadow:
          state === "scanning"
            ? "0 0 32px rgba(195, 40, 40, 0.2)"
            : "0 0 16px rgba(0,0,0,0.3)",
      }}
    >
      {objectUrl && (
        <img
          src={objectUrl}
          alt="Preview"
          className="w-full h-full object-cover"
        />
      )}

      {/* Scan overlay canvas */}
      <CanvasScanOverlay
        state={state}
        imageWidth={360}
        imageHeight={480}
      />

      {/* State label */}
      {state === "scanning" && (
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <span className="animate__animated animate__pulse inline-block px-4 py-1.5 rounded-full text-sm font-medium"
            style={{ background: "rgba(195, 40, 40, 0.7)", color: "#F7F2E8" }}>
            识别中...
          </span>
        </div>
      )}
    </div>
  );
}
