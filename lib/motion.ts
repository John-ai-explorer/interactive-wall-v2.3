import type { MotionConfig } from "./types";

export const motionConfig: MotionConfig = {
  pageEnter: "animate__animated animate__fadeIn",
  cardEnter: "animate__animated animate__fadeInUp",
  successEnter: "animate__animated animate__zoomIn",
  errorShake: "animate__animated animate__shakeX",
  slowPulse: "animate__animated animate__pulse",
};

/** Stagger delay helper for card lists */
export function staggerDelay(index: number, baseMs = 80): string {
  return `${index * baseMs}ms`;
}

/** Shared easing curve */
export const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Shared transition durations (ms) */
export const DURATION = {
  pageEnter: 800,
  cardEnter: 500,
  buttonFeedback: 150,
  nodeSwitch: 400,
  cameraTransition: 1100,
} as const;
