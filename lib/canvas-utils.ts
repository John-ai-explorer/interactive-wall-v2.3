// ============================================================
// Shared Canvas 2D utilities
// ============================================================

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  baseAlpha: number;
  color: string;
};

/** Create ambient floating particles */
export function createParticles(
  count: number,
  width: number,
  height: number
): Particle[] {
  const colors = [
    "rgba(214, 168, 79, VAR)", // gold
    "rgba(195, 40, 40, VAR)", // red
    "rgba(247, 242, 232, VAR)", // white
  ];
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const baseAlpha = 0.08 + Math.random() * 0.17;
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2 - 0.1,
      radius: 1 + Math.random() * 2.5,
      alpha: baseAlpha,
      baseAlpha,
      color,
    });
  }
  return particles;
}

/** Update particle positions (wrap around edges) */
export function updateParticles(
  particles: Particle[],
  width: number,
  height: number,
  mouseX?: number,
  mouseY?: number
): void {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;

    // Subtle mouse parallax
    if (mouseX !== undefined && mouseY !== undefined) {
      const dx = (mouseX / width - 0.5) * 0.3;
      const dy = (mouseY / height - 0.5) * 0.3;
      p.x += dx;
      p.y += dy;
    }

    // Wrap
    if (p.x < -10) p.x = width + 10;
    if (p.x > width + 10) p.x = -10;
    if (p.y < -10) p.y = height + 10;
    if (p.y > height + 10) p.y = -10;

    // Gentle alpha flicker
    p.alpha =
      p.baseAlpha + Math.sin(Date.now() * 0.001 + p.x * 0.01) * 0.04;
  }
}

/** Draw a scanning line */
export function drawScanLine(
  ctx: CanvasRenderingContext2D,
  y: number,
  width: number,
  color = "rgba(195, 40, 40, 0.6)"
): void {
  const gradient = ctx.createLinearGradient(0, y - 4, 0, y + 4);
  gradient.addColorStop(0, "rgba(195, 40, 40, 0)");
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(1, "rgba(195, 40, 40, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y - 4, width, 8);
}

/** Draw scan corner markers */
export function drawScanCorners(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color = "rgba(214, 168, 79, 0.7)"
): void {
  const len = 24;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(x, y + len);
  ctx.lineTo(x, y);
  ctx.lineTo(x + len, y);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(x + w - len, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + len);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(x, y + h - len);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + len, y + h);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(x + w - len, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - len);
  ctx.stroke();
}

/** Draw a sound wave visualization */
export function drawSoundWave(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amplitude: number,
  color = "rgba(214, 168, 79, 0.5)"
): void {
  const centerY = height / 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x <= width; x += 2) {
    const t = x / width;
    const y =
      centerY +
      Math.sin(t * Math.PI * 6 + Date.now() * 0.003) * amplitude * 20;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
