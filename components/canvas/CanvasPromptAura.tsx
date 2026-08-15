"use client";

import { useEffect, useRef } from "react";

type Props = {
  active?: boolean;
  className?: string;
};

export default function CanvasPromptAura({
  active = false,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<
    { x: number; y: number; ox: number; oy: number; phase: number }[]
  >([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = 300;
    };
    resize();
    window.addEventListener("resize", resize);

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 60 + Math.random() * 120;
        particlesRef.current.push({
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
          ox: cx + Math.cos(angle) * radius,
          oy: cy + Math.sin(angle) * radius,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      const now = Date.now() * 0.001;

      for (const p of particlesRef.current) {
        if (active) {
          // Converge toward center
          p.x += (cx - p.x) * 0.008;
          p.y += (cy - p.y) * 0.008;
        } else {
          // Return to origin orbit
          p.x += (p.ox - p.x) * 0.003;
          p.y += (p.oy - p.y) * 0.003;
        }

        const alpha = active
          ? 0.2 + Math.sin(now * 2 + p.phase) * 0.1
          : 0.06 + Math.sin(now * 0.5 + p.phase) * 0.04;

        ctx.fillStyle = `rgba(214, 168, 79, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
