"use client";

import { useEffect, useRef } from "react";
import { drawScanLine, drawScanCorners } from "@/lib/canvas-utils";
import type { ScanVisualState } from "@/lib/types";

type Props = {
  state: ScanVisualState;
  imageWidth?: number;
  imageHeight?: number;
};

export default function CanvasScanOverlay({
  state,
  imageWidth = 360,
  imageHeight = 480,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanYRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = imageWidth;
      const h = imageHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, w, h);

      if (state === "scanning") {
        // Animate scan line
        scanYRef.current += 1.5;
        if (scanYRef.current > h + 10) scanYRef.current = -10;
        drawScanLine(ctx, scanYRef.current, w);

        // Draw grid
        ctx.strokeStyle = "rgba(214, 168, 79, 0.08)";
        ctx.lineWidth = 0.5;
        const step = 30;
        for (let x = step; x < w; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = step; y < h; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Data dots
        ctx.fillStyle = "rgba(214, 168, 79, 0.3)";
        for (let i = 0; i < 15; i++) {
          const dx = Math.random() * w;
          const dy = Math.random() * h;
          ctx.beginPath();
          ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (state === "matched") {
        scanYRef.current = h * 0.5;
        drawScanLine(ctx, scanYRef.current, w, "rgba(214, 168, 79, 0.5)");
      }

      // Draw corners
      const pad = 16;
      const cornerColor =
        state === "matched"
          ? "rgba(214, 168, 79, 0.8)"
          : state === "failed"
          ? "rgba(139, 30, 30, 0.7)"
          : "rgba(214, 168, 79, 0.5)";
      drawScanCorners(ctx, pad, pad, w - pad * 2, h - pad * 2, cornerColor);

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(rafRef.current);
  }, [state, imageWidth, imageHeight]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
