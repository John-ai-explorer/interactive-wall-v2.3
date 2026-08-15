import { getAllStories, getStoryById } from "@/lib/stories";
import type { StoryExperience } from "@/lib/types";

export type SceneTagEntry = {
  storyId: string;
  eventId: string;
  title: string;
  primaryLabels: string[];
  legacyIds: string[];
  keywords: string[];
  aliases: string[];
  visualHints: string[];
  tags: string[];
};

export type ImageTagInput = {
  tags: string[];
  objects?: string[];
  text?: string[];
  concepts?: string[];
};

export type SceneMatch = {
  matched: boolean;
  storyId?: string;
  eventId: string;
  title: string;
  confidence: number;
  minConfidence: number;
  reason: string;
  tags: string[];
};

const DEFAULT_MIN_CONFIDENCE = 0.65;

const CURATED_TAGS: Record<
  string,
  {
    aliases: string[];
    visualHints: string[];
  }
> = {
  "qian-xuesen": {
    aliases: [
      "钱学森",
      "科技报国",
      "两弹一星",
      "原子弹",
      "核爆",
      "核爆炸",
      "爆炸",
      "蘑菇云",
      "导弹",
      "火箭",
      "航天",
      "国防科技",
      "科学家精神",
      "系统工程",
      "atomic bomb",
      "nuclear bomb",
      "nuclear explosion",
      "mushroom cloud",
      "missile",
      "rocket",
      "aerospace",
      "national defense",
    ],
    visualHints: [
      "蘑菇云",
      "爆炸火光",
      "核试验画面",
      "导弹发射",
      "火箭发射",
      "科学家肖像",
      "钱学森照片",
      "atomic explosion",
      "missile launch",
      "rocket launch",
    ],
  },
  change5: {
    aliases: [
      "嫦娥五号",
      "逐月取壤",
      "月球",
      "月壤",
      "探测器",
      "航天器",
      "采样返回",
      "月面着陆",
      "环月飞行",
      "交会对接",
      "chang'e 5",
      "change5",
      "moon",
      "lunar",
      "lunar soil",
      "spacecraft",
      "lunar sample",
    ],
    visualHints: [
      "月球表面",
      "月壤采样",
      "月球探测器",
      "航天器着陆",
      "返回器",
      "moon surface",
      "lunar lander",
      "spacecraft on moon",
    ],
  },
};

export function buildSceneTagLibrary(): SceneTagEntry[] {
  return getAllStories().map((story) => {
    const curated = CURATED_TAGS[story.id] ?? { aliases: [], visualHints: [] };
    const keywords = collectStoryKeywords(story);
    const primaryLabels = uniqueTags([
      story.title,
      story.shortTitle,
      story.subtitle,
      ...story.legacyIds,
    ]);
    const tags = uniqueTags([
      story.id,
      ...story.legacyIds,
      story.title,
      story.shortTitle,
      story.subtitle,
      ...keywords,
      ...curated.aliases,
      ...curated.visualHints,
    ]);

    return {
      storyId: story.id,
      eventId: story.legacyIds[0] ?? story.id,
      title: story.title,
      primaryLabels,
      legacyIds: story.legacyIds,
      keywords,
      aliases: curated.aliases,
      visualHints: curated.visualHints,
      tags,
    };
  });
}

export function matchImageTagsToScene(
  input: ImageTagInput,
  library = buildSceneTagLibrary(),
  minConfidence = getScanMinConfidence()
): SceneMatch {
  const imageTags = uniqueTags([
    ...input.tags,
    ...(input.objects ?? []),
    ...(input.text ?? []),
    ...(input.concepts ?? []),
  ]);

  if (imageTags.length === 0) {
    return unmatched("未能从图片中提取到有效标签。", [], minConfidence);
  }

  const scored = library
    .map((scene) => scoreScene(imageTags, scene))
    .sort((a, b) => b.score - a.score);
  const best = scored[0];

  if (!best || best.score < 2 || best.strongHitCount < 2) {
    return unmatched("没有相关主题，请重新拍摄文化墙中的人物、事件、文字或图像主体。", imageTags, minConfidence);
  }

  const story = getStoryById(best.scene.storyId);
  if (!story) {
    return unmatched("匹配到的场景不存在于当前场景库。", imageTags, minConfidence);
  }

  const confidence = Math.min(
    0.98,
    Math.max(
      0.68,
      best.score / 8 + Math.min(Math.max(best.strongHitCount - 1, 0), 3) * 0.05
    )
  );

  if (confidence < minConfidence) {
    return {
      matched: false,
      eventId: "",
      title: "未识别到匹配故事",
      confidence,
      minConfidence,
      reason: `当前最佳匹配为“${story.title}”，匹配度 ${(confidence * 100).toFixed(0)}%，低于要求的 ${(minConfidence * 100).toFixed(0)}%，请重新拍摄更清晰的主体。`,
      tags: imageTags,
    };
  }

  return {
    matched: true,
    storyId: story.id,
    eventId: best.scene.legacyIds.includes("atomic_bomb") && best.hits.some(isAtomicTag)
      ? "atomic_bomb"
      : best.scene.eventId,
    title: story.title,
    confidence,
    minConfidence,
    reason: `图片标签「${best.hits.slice(0, 4).join("、")}」与“${story.title}”场景高度相关，匹配度达到 ${(confidence * 100).toFixed(0)}%。`,
    tags: imageTags,
  };
}

export function fallbackMatchFromText(text: string): SceneMatch {
  const minConfidence = getScanMinConfidence();
  const tags = extractWeakTags(text);
  const match = matchImageTagsToScene({ tags }, buildSceneTagLibrary(), minConfidence);
  if (match.matched) return match;

  return unmatched("没有相关主题，请重新拍摄文化墙中的人物、事件、文字或图像主体。", tags, minConfidence);
}

export function getScanMinConfidence(): number {
  const raw = process.env.SCAN_MIN_CONFIDENCE;
  if (!raw) return DEFAULT_MIN_CONFIDENCE;

  const value = Number(raw);
  if (!Number.isFinite(value)) return DEFAULT_MIN_CONFIDENCE;

  if (value > 1) return Math.min(1, Math.max(0, value / 100));
  return Math.min(1, Math.max(0, value));
}

export function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[，。、“”‘’：:；;！!？?（）()【】\[\]{}]/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectStoryKeywords(story: StoryExperience): string[] {
  return uniqueTags([
    story.title,
    story.shortTitle,
    story.subtitle,
    story.description,
    ...story.spiritKeywords,
    ...story.chapters.flatMap((chapter) => [
      chapter.title,
      chapter.subtitle ?? "",
      chapter.summary,
      chapter.body,
    ]),
  ]);
}

function scoreScene(imageTags: string[], scene: SceneTagEntry) {
  const sceneTags = scene.tags.map(normalizeTag).filter(Boolean);
  const primaryLabels = scene.primaryLabels.map(normalizeTag).filter(Boolean);
  const hits: string[] = [];
  const strongHits: string[] = [];
  let score = 0;

  for (const rawImageTag of imageTags) {
    const imageTag = normalizeTag(rawImageTag);
    if (!imageTag) continue;

    let bestWeight = 0;
    let matchedPrimary = false;

    for (const sceneTag of sceneTags) {
      if (!sceneTag) continue;
      const isPrimary = primaryLabels.includes(sceneTag);

      if (imageTag === sceneTag) {
        const exactWeight = isPrimary ? 4 : 3;
        if (exactWeight > bestWeight) {
          bestWeight = exactWeight;
          matchedPrimary = isPrimary;
        }
        continue;
      }

      if (imageTag.includes(sceneTag) || sceneTag.includes(imageTag)) {
        const partialWeight = imageTag.length >= 2 && sceneTag.length >= 2 ? (isPrimary ? 2.5 : 1.5) : 0;
        if (partialWeight > bestWeight) {
          bestWeight = partialWeight;
          matchedPrimary = isPrimary;
        }
      }
    }

    if (bestWeight > 0) {
      score += bestWeight;
      hits.push(rawImageTag);
      if (matchedPrimary) {
        strongHits.push(rawImageTag);
      }
    }
  }

  return { scene, score, hits: uniqueTags(hits), strongHitCount: uniqueTags(strongHits).length };
}

function extractWeakTags(text: string): string[] {
  const normalized = normalizeTag(text);
  const tags: string[] = [];

  const rules: Array<[RegExp, string[]]> = [
    [/(atomic|bomb|nuclear|missile|rocket|qian|钱学森|两弹一星|原子弹|核爆|爆炸|蘑菇云|导弹|火箭)/i, ["原子弹", "爆炸", "钱学森", "atomic bomb"]],
    [/(chang|change|moon|lunar|嫦娥|月球|月壤|探测器|航天器)/i, ["嫦娥五号", "月球", "月壤", "lunar"]],
  ];

  for (const [regex, matchedTags] of rules) {
    if (regex.test(normalized)) tags.push(...matchedTags);
  }

  return uniqueTags(tags);
}

function unmatched(reason: string, tags: string[], minConfidence: number): SceneMatch {
  return {
    matched: false,
    eventId: "",
    title: "未识别到匹配故事",
    confidence: 0,
    minConfidence,
    reason,
    tags,
  };
}

function uniqueTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of tags) {
    const trimmed = tag.trim();
    const normalized = normalizeTag(trimmed);
    if (!trimmed || !normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(trimmed);
  }

  return result;
}

function isAtomicTag(tag: string): boolean {
  return /atomic|bomb|nuclear|原子弹|核爆|爆炸|蘑菇云/i.test(tag);
}
