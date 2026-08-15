import type { TimelineNode } from "./types";

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Get the current timeline node based on progress */
export function getCurrentNode(
  progress: number,
  timeline: TimelineNode[]
): TimelineNode {
  let current = timeline[0];
  for (const node of timeline) {
    if (progress >= node.progress) {
      current = node;
    }
  }
  return current;
}

/** Linear interpolation between two numbers */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Linearly interpolate between two 3D vectors (returns new array) */
export function lerpV3(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/** Given progress, interpolate between two camera presets */
export function interpolateCamera(
  progress: number,
  timeline: TimelineNode[]
): {
  position: [number, number, number];
  target: [number, number, number];
} {
  if (timeline.length === 0) {
    return { position: [0, 2, 5], target: [0, 0, 0] };
  }
  if (progress <= timeline[0].progress) {
    return {
      position: timeline[0].camera.position,
      target: timeline[0].camera.target,
    };
  }
  if (progress >= timeline[timeline.length - 1].progress) {
    const last = timeline[timeline.length - 1];
    return { position: last.camera.position, target: last.camera.target };
  }

  // Find two surrounding nodes
  let prev = timeline[0];
  let next = timeline[timeline.length - 1];
  for (let i = 0; i < timeline.length - 1; i++) {
    if (
      progress >= timeline[i].progress &&
      progress <= timeline[i + 1].progress
    ) {
      prev = timeline[i];
      next = timeline[i + 1];
      break;
    }
  }

  const range = next.progress - prev.progress;
  const t = range === 0 ? 0 : (progress - prev.progress) / range;

  return {
    position: lerpV3(prev.camera.position, next.camera.position, t),
    target: lerpV3(prev.camera.target, next.camera.target, t),
  };
}

/** Process wheel delta into progress change */
export function wheelToProgressDelta(
  deltaY: number,
  sensitivity = 0.035
): number {
  return deltaY > 0 ? sensitivity : -sensitivity;
}
