// ============================================================
// Core data types for Scientist Spirit Culture Wall
// ============================================================

export type CameraPreset = {
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
};

export type TimelineNode = {
  id: string;
  progress: number;
  title: string;
  subtitle?: string;
  text: string;
  video: string;
  audio?: string;
  thumbnail?: string;

  camera: CameraPreset;

  marker: {
    position: [number, number, number];
    label?: string;
  };

  animation?: {
    markerPulse?: boolean;
    screenGlow?: boolean;
    pathHighlight?: boolean;
  };
};

export type SpiritKeyword =
  | "爱国"
  | "创新"
  | "求实"
  | "奉献"
  | "协同"
  | "育人"
  | "攻关"
  | "担当"
  | "自立自强"
  | "服务国家战略";

export type EventVisual = {
  hero_image?: string;
  theme_color?: string;
  accent_color?: string;
  particle_profile?: "space" | "lab" | "field" | "medicine" | "deep_earth";
};

export type EventItem = {
  event_id: string;
  title: string;
  scientist: string;
  theme: string;
  spirit_keywords: SpiritKeyword[];
  cover_image: string;
  description: string;

  videos: string[];
  texts: string[];
  audio: string;
  bgm: string;

  scene3d: string;
  timeline: TimelineNode[];

  visual?: EventVisual;
};

// ---- Scan / Recognize ----

export type ScanVisualState =
  | "idle"
  | "preview"
  | "scanning"
  | "matched"
  | "failed";

export type RecognizeResult = {
  matched: boolean;
  event_id: string;
  story_id?: string;
  confidence: number;
  minConfidence?: number;
  title: string;
  reason?: string;
  tags?: string[];
};

// ---- V2.0 Story Experience ----

export type StoryTheme = "heritage-red" | "lunar-blue";

export type PerformanceTier = "high" | "medium" | "fallback";

export type StoryQuestion = {
  type: "choice" | "binary" | "observe" | "open";
  question: string;
  options?: string[];
  correctIndex?: number;
  feedback: string;
};

export type StoryChapter = {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  summary: string;
  body: string;
  image: string;
  video?: string;
  videoPoster?: string;
  narration?: string;
  scene: {
    cameraPosition: [number, number, number];
    cameraTarget: [number, number, number];
    hotspot?: [number, number, number];
    highlightColor?: string;
  };
  question?: StoryQuestion;
};

export type StoryExperience = {
  id: string;
  legacyIds: string[];
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  theme: StoryTheme;
  spiritKeywords: SpiritKeyword[];
  hero: {
    poster: string;
    mobilePoster?: string;
  };
  scene: {
    modelHigh?: string;
    modelCompressed?: string;
    fallbackPoster: string;
    initialRotation?: [number, number, number];
  };
  audio: {
    bgm?: string;
    bgmVolume?: number;
    narration?: string;
  };
  chapters: StoryChapter[];
};

// ---- Story Progress ----

export type StoryProgress = {
  progress: number; // 0 - 1
  currentNodeId: string;
  direction: "forward" | "backward";
  isTransitioning: boolean;
};

// ---- Q&A ----

export type QAItem = {
  question: string;
  answer: string;
  related_events: string[];
  keywords: string[];
};

// ---- News ----

/** 新闻星级: 0=普通, 1-5=重要性递增 (5为最高), 星级新闻不超过总数的5% */
export type StarRating = 0 | 1 | 2 | 3 | 4 | 5;

export type NewsItem = {
  title: string;
  summary: string;
  audio?: string;
  image?: string;
  /** 新闻来源 (e.g. "新华网", "人民网", "科技日报") */
  source: string;
  /** 新闻原始链接 */
  url: string;
  /** 发布时间 ISO string */
  publishedAt: string;
  /** 星级评分: 0=普通新闻, 1-5=重要性递增。5星为核心经典新闻，受保护不被自动淘汰。
   *  规则: 星级新闻总数 ≤ 数据库总数 × 5% */
  stars: StarRating;
};

export type WeeklyNews = {
  week: string;
  theme: string;
  items: NewsItem[];
  /** 数据最后更新时间 */
  updatedAt: string;
  /** 数据库统计 */
  dbStats?: {
    total: number;
    starred: number;
    maxCapacity: number;
  };
};

// ---- Generate ----

export type GenerateStyle = {
  id: string;
  label: string;
  description: string;
};

export type GenerateRequest = {
  scientist: string;
  style: string;
  theme: string;
};

// ---- UI Motion ----

export type MotionConfig = {
  pageEnter: string;
  cardEnter: string;
  successEnter: string;
  errorShake: string;
  slowPulse: string;
};
