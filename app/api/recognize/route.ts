import { NextResponse } from "next/server";
import type { RecognizeResult } from "@/lib/types";
import {
  buildSceneTagLibrary,
  fallbackMatchFromText,
  matchImageTagsToScene,
  type ImageTagInput,
} from "@/lib/scene-tags";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const DEFAULT_MODEL = "claude-opus-4-8";
const ANTHROPIC_VERSION = "2023-06-01";

type VisionTagResponse = {
  tags?: string[];
  objects?: string[];
  text?: string[];
  concepts?: string[];
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        createFailedResult("请上传需要识别的图片。"),
        { status: 400 }
      );
    }

    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        createFailedResult("上传文件不是支持的图片格式。"),
        { status: 400 }
      );
    }

    if (image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        createFailedResult("图片过大，请上传 8MB 以内的图片。"),
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const base64 = buffer.toString("base64");
    const sceneLibrary = buildSceneTagLibrary();
    const modelTags = await extractImageTagsWithVisionModel({
      base64,
      mediaType: image.type,
      sceneLibrary,
    });

    const match = modelTags
      ? matchImageTagsToScene(modelTags, sceneLibrary)
      : fallbackMatchFromText(image.name);

    return NextResponse.json(toRecognizeResult(match));
  } catch (error) {
    console.error("/api/recognize failed", error);
    return NextResponse.json(
      toRecognizeResult(fallbackMatchFromText("")),
      { status: 200 }
    );
  }
}

async function extractImageTagsWithVisionModel({
  base64,
  mediaType,
  sceneLibrary,
}: {
  base64: string;
  mediaType: string;
  sceneLibrary: ReturnType<typeof buildSceneTagLibrary>;
}): Promise<ImageTagInput | null> {
  const provider = process.env.VISION_LLM_PROVIDER ?? "anthropic";
  const apiKey = process.env.VISION_LLM_API_KEY ?? process.env.ANTHROPIC_API_KEY;

  if (!apiKey || provider !== "anthropic") {
    return null;
  }

  const model = process.env.VISION_LLM_MODEL ?? DEFAULT_MODEL;
  const baseUrl = process.env.VISION_LLM_BASE_URL ?? "https://api.anthropic.com";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/messages`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        temperature: 0,
        system:
          "你是互动文化墙的图片语义标签提取器。只输出严格 JSON，不要输出 Markdown。不要编造不存在的场景，只提取图片中可见内容、文字和可推断的主题标签。",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: buildVisionPrompt(sceneLibrary),
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn("Vision model request failed", response.status);
      return null;
    }

    const data = await response.json();
    const text = extractAnthropicText(data);
    return parseVisionTags(text);
  } catch (error) {
    console.warn("Vision model unavailable", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function buildVisionPrompt(sceneLibrary: ReturnType<typeof buildSceneTagLibrary>) {
  const scenes = sceneLibrary.map((scene) => ({
    story_id: scene.storyId,
    title: scene.title,
    aliases: scene.aliases,
    visualHints: scene.visualHints,
    existingTags: scene.tags.slice(0, 24),
  }));

  return `请分析这张手机拍摄/上传的图片，并从图片中提取可用于匹配文化墙场景的标签。\n\n当前已有场景库如下，后续本地程序会把你提取的图片标签与这些场景标签比对：\n${JSON.stringify(
    scenes,
    null,
    2
  )}\n\n请只返回严格 JSON，格式如下：\n{"objects":["图片中可见物体"],"text":["OCR文字"],"concepts":["可推断事件/主题"],"tags":["标准化中英文关键词"]}\n\n请优先输出能对应场景标题、短标题、副标题或明确主题名的标签，不要为了凑匹配而编造不相关标签。\n如果无法确认主题，就只输出图片里真实可见的内容，不要强行补出故事名。\n如果图片像原子弹爆炸、蘑菇云、核试验、导弹/火箭/两弹一星，请在 tags/concepts 中包含“原子弹”“爆炸”“蘑菇云”“atomic bomb”“nuclear explosion”等。\n如果图片像月球、月壤、嫦娥五号、航天器、月面采样，请包含“嫦娥五号”“月球”“月壤”“lunar”等。`;
}

function extractAnthropicText(data: unknown): string {
  if (!data || typeof data !== "object" || !("content" in data)) return "";
  const content = (data as { content?: unknown }).content;
  if (!Array.isArray(content)) return "";

  return content
    .map((item) => {
      if (!item || typeof item !== "object" || !("text" in item)) return "";
      const text = (item as { text?: unknown }).text;
      return typeof text === "string" ? text : "";
    })
    .join("\n")
    .trim();
}

function parseVisionTags(text: string): ImageTagInput | null {
  if (!text) return null;
  const jsonText = text.match(/\{[\s\S]*\}/)?.[0] ?? text;

  try {
    const parsed = JSON.parse(jsonText) as VisionTagResponse;
    return {
      tags: asStringArray(parsed.tags),
      objects: asStringArray(parsed.objects),
      text: asStringArray(parsed.text),
      concepts: asStringArray(parsed.concepts),
    };
  } catch {
    return null;
  }
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function toRecognizeResult(match: ReturnType<typeof matchImageTagsToScene>): RecognizeResult {
  return {
    matched: match.matched,
    event_id: match.eventId,
    story_id: match.storyId,
    confidence: match.confidence,
    minConfidence: match.minConfidence,
    title: match.title,
    reason: match.reason,
    tags: match.tags,
  };
}

function createFailedResult(reason: string): RecognizeResult {
  return {
    matched: false,
    event_id: "",
    confidence: 0,
    title: "未识别到匹配故事",
    reason,
    tags: [],
  };
}
