"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  createParticles,
  updateParticles,
  type Particle,
} from "@/lib/canvas-utils";

type Props = {
  particleCount?: number;
  className?: string;
};

export default function CanvasAmbientBackground({
  particleCount = 100,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1, y: -1 });
  const rafRef = useRef<number>(0);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    resize();
    particlesRef.current = createParticles(
      particleCount,
      window.innerWidth,
      window.innerHeight
    );

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleResize = () => {
      resize();
      particlesRef.current = createParticles(
        particleCount,
        window.innerWidth,
        window.innerHeight
      );
    };

    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("resize", handleResize);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      const { innerWidth: w, innerHeight: h } = window;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      updateParticles(
        particlesRef.current,
        w,
        h,
        mouseRef.current.x,
        mouseRef.current.y
      );

      // Draw particles
      for (const p of particlesRef.current) {
        const color = p.color.replace("VAR", String(p.alpha));
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw subtle connections between nearby particles
      const pts = particlesRef.current;
      for (let i = 0; i < pts.length; i += 2) {
        for (let j = i + 1; j < pts.length; j += 3) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.08;
            ctx.strokeStyle = `rgba(214, 168, 79, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [particleCount, resize]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
