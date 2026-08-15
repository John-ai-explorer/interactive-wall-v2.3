"use client";

import { useEffect, useRef } from "react";

type Props = {
  imageUrl?: string;
  title: string;
  onDone: () => void;
};

export default function ScanTransitionCanvas({ imageUrl, title, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.scale(dpr, dpr);

    const img = new Image();
    let loaded = false;
    img.onload = () => {
      loaded = true;
    };
    if (imageUrl) img.src = imageUrl;

    const particles = Array.from({ length: 32 }, () => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      r: 1 + Math.random() * 2,
    }));

    const started = performance.now();
    const draw = (now: number) => {
      const elapsed = now - started;
      const progress = Math.min(elapsed / 900, 1);
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (loaded) {
        ctx.globalAlpha = 0.72;
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = "#080E1A";
        ctx.fillRect(0, 0, rect.width, rect.height);
      }

      ctx.fillStyle = "rgba(8,14,26,0.55)";
      ctx.fillRect(0, 0, rect.width, rect.height);

      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const boxW = Math.min(rect.width * 0.72, 320);
      const boxH = Math.min(rect.height * 0.46, 280);
      const x = cx - boxW / 2;
      const y = cy - boxH / 2;
      const lineY = y + boxH * progress;

      ctx.strokeStyle = "rgba(214,168,79,0.92)";
      ctx.lineWidth = 2;
      const corner = 28;
      [[x, y], [x + boxW, y], [x, y + boxH], [x + boxW, y + boxH]].forEach(([px, py], i) => {
        const sx = i % 2 === 0 ? 1 : -1;
        const sy = i < 2 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(px, py + sy * corner);
        ctx.lineTo(px, py);
        ctx.lineTo(px + sx * corner, py);
        ctx.stroke();
      });

      const grad = ctx.createLinearGradient(x, lineY - 20, x, lineY + 20);
      grad.addColorStop(0, "rgba(214,168,79,0)");
      grad.addColorStop(0.5, "rgba(214,168,79,0.9)");
      grad.addColorStop(1, "rgba(214,168,79,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(x, lineY - 20, boxW, 40);

      particles.forEach((p) => {
        const px = p.x + (cx - p.x) * progress;
        const py = p.y + (cy - p.y) * progress;
        ctx.fillStyle = "rgba(247,242,232,0.75)";
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = "#F7F2E8";
      ctx.font = "600 18px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("识别成功", cx, y + boxH + 52);
      ctx.fillStyle = "#D6A84F";
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillText(title, cx, y + boxH + 80);

      if (progress < 1) {
        raf = requestAnimationFrame(draw);
      } else {
        window.setTimeout(onDone, 300);
      }
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [imageUrl, onDone, title]);

  return (
    <div className="fixed inset-0 z-[70] bg-[#080E1A]">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
