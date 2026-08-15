"use client";

import { useEffect, useRef } from "react";
import { drawSoundWave } from "@/lib/canvas-utils";

type Props = {
  playing?: boolean;
  className?: string;
};

export default function CanvasBroadcastWave({
  playing = false,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const amplitudeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent?.clientWidth || 600;
      canvas.height = 120;
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Target amplitude
      const target = playing ? 1 : 0.1;
      amplitudeRef.current += (target - amplitudeRef.current) * 0.05;

      if (amplitudeRef.current > 0.05) {
        drawSoundWave(ctx, canvas.width, canvas.height, amplitudeRef.current);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${className}`}
      aria-hidden="true"
    />
  );
}
