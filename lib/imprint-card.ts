import type { StoryExperience } from "@/lib/types";
import { getImprintBackground } from "@/lib/stories";

export type ImprintCardInput = {
  story: StoryExperience;
  completedCount: number;
  dateLabel: string;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`无法加载图片: ${src}`));
    image.src = src;
  });
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const chars = Array.from(text);
  let line = "";
  let currentY = y;

  chars.forEach((char) => {
    const nextLine = line + char;
    if (ctx.measureText(nextLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = char;
      currentY += lineHeight;
    } else {
      line = nextLine;
    }
  });

  if (line) ctx.fillText(line, x, currentY);
}

export async function renderImprintCard({
  story,
  completedCount,
  dateLabel,
}: ImprintCardInput): Promise<string> {
  const lowMemory =
    typeof navigator !== "undefined" &&
    ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4) <= 2;
  const width = lowMemory ? 720 : 1080;
  const height = lowMemory ? 960 : 1440;
  const scale = width / 1080;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("当前浏览器不支持 Canvas 导出");

  const bg = await loadImage(getImprintBackground(story));
  ctx.drawImage(bg, 0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(8,14,26,0.1)");
  gradient.addColorStop(0.35, "rgba(8,14,26,0.62)");
  gradient.addColorStop(1, "rgba(8,14,26,0.86)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#D6A84F";
  ctx.font = `${24 * scale}px system-ui, sans-serif`;
  ctx.fillText("科学家精神文化长廊", 72 * scale, 128 * scale);

  ctx.fillStyle = "#F7F2E8";
  ctx.font = `700 ${60 * scale}px system-ui, sans-serif`;
  drawWrappedText(ctx, story.title, 72 * scale, 238 * scale, 760 * scale, 74 * scale);

  ctx.fillStyle = "#D9D0C1";
  ctx.font = `${28 * scale}px system-ui, sans-serif`;
  drawWrappedText(
    ctx,
    `我完成了 ${completedCount}/5 个故事节点`,
    72 * scale,
    430 * scale,
    800 * scale,
    44 * scale
  );
  ctx.fillText(dateLabel, 72 * scale, 494 * scale);

  const keywords = story.spiritKeywords.slice(0, 3);
  keywords.forEach((keyword, index) => {
    const x = 72 * scale + index * 210 * scale;
    const y = 610 * scale;
    ctx.strokeStyle = "rgba(214,168,79,0.72)";
    ctx.fillStyle = "rgba(214,168,79,0.12)";
    ctx.lineWidth = 2 * scale;
    ctx.roundRect(x, y, 170 * scale, 64 * scale, 32 * scale);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#F7F2E8";
    ctx.font = `700 ${30 * scale}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(keyword, x + 85 * scale, y + 42 * scale);
    ctx.textAlign = "start";
  });

  ctx.fillStyle = "#E8D7A4";
  ctx.font = `${32 * scale}px system-ui, sans-serif`;
  drawWrappedText(
    ctx,
    "把个人理想融入国家需要，在求实创新中接续科技报国之志。",
    72 * scale,
    790 * scale,
    820 * scale,
    52 * scale
  );

  ctx.fillStyle = "rgba(247,242,232,0.92)";
  ctx.fillRect(72 * scale, 1040 * scale, 180 * scale, 180 * scale);
  ctx.strokeStyle = "rgba(214,168,79,0.75)";
  ctx.lineWidth = 4 * scale;
  ctx.strokeRect(72 * scale, 1040 * scale, 180 * scale, 180 * scale);
  ctx.fillStyle = "#5C1111";
  ctx.font = `${22 * scale}px system-ui, sans-serif`;
  ctx.fillText("项目入口", 116 * scale, 1138 * scale);

  ctx.fillStyle = "rgba(247,242,232,0.68)";
  ctx.font = `${22 * scale}px system-ui, sans-serif`;
  ctx.fillText("数字生成纪念卡", 72 * scale, 1306 * scale);

  return canvas.toDataURL("image/png");
}
