import type { EventItem, RecognizeResult, WeeklyNews } from "./types";

const API_BASE = "/api";

/** Recognize an uploaded image → returns matched story */
export async function recognizeImage(file: File): Promise<RecognizeResult> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_BASE}/recognize`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Image recognition failed");
  }

  return res.json();
}

/** Fetch a single event by id */
export async function fetchEvent(eventId: string): Promise<EventItem | null> {
  const res = await fetch(`${API_BASE}/events/${eventId}`);
  if (!res.ok) return null;
  return res.json();
}

/** Fetch all events (for card grid) */
export async function fetchAllEvents(): Promise<EventItem[]> {
  const res = await fetch(`${API_BASE}/events`);
  if (!res.ok) return [];
  return res.json();
}

/** Submit a question → get answer */
export async function askQuestion(
  question: string
): Promise<{ answer: string; related_events: string[] }> {
  await sleep(600 + Math.random() * 800);
  // Simple keyword matching demo
  const q = question.toLowerCase();
  if (q.includes("钱学森") || q.includes("归国")) {
    return {
      answer:
        "钱学森归国的故事体现了科学家精神中的爱国与奉献。他放弃海外优厚条件，选择回到祖国参与国家科技事业建设。这不仅是个人选择，也是把科学理想与民族复兴结合起来的典型案例。对今天的青年而言，这种精神启示我们要把个人发展与国家需要结合起来，在关键领域勇于攻关、敢于担当。",
      related_events: ["qian_xuesen_001"],
    };
  }
  if (q.includes("两弹一星") || q.includes("航天")) {
    return {
      answer:
        "两弹一星精神是中国科学家精神的集中体现，代表了爱国奉献、自力更生、艰苦奋斗、大力协同的优良传统。这一精神至今仍激励着广大科技工作者服务国家战略需求。",
      related_events: ["qian_xuesen_001"],
    };
  }
  return {
    answer:
      "科学家精神包含了爱国、创新、求实、奉献、协同、育人等丰富内涵。每一位科学家的故事都是这一精神的生动体现，值得我们在新时代继续传承和发扬。",
    related_events: [],
  };
}

/** Generate an image (stub) */
export async function generateImage(_req: {
  scientist: string;
  style: string;
  theme: string;
}): Promise<{ image_url: string; status: string }> {
  void _req;
  await sleep(2000);
  return {
    status: "stub",
    image_url: "/assets/generated/demo_qian_xuesen_space.png",
  };
}

/** Fetch weekly news */
export async function fetchWeeklyNews(): Promise<WeeklyNews> {
  const res = await fetch(`${API_BASE}/news/weekly`);
  if (!res.ok) {
    return {
      week: "2026-W27",
      theme: "弘扬科学家精神，服务科技强国建设",
      items: [],
      updatedAt: new Date().toISOString(),
    };
  }
  return res.json();
}

/** Recommend questions for QA page */
export function getRecommendedQuestions(): string[] {
  return [
    "钱学森为什么选择回国？",
    "什么是两弹一星精神？",
    "科学家精神的核心内涵是什么？",
    "钱学森在哪些领域做出了重要贡献？",
  ];
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
