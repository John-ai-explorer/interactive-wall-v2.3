import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type { WeeklyNews, NewsItem, StarRating } from "@/lib/types";

// ============================================================
// News Database Configuration
// ============================================================
const MAX_CAPACITY = 250;
const MAX_STAR_PERCENT = 0.05; // Max 5% of total can be starred (≥1★)
const DB_PATH = join(process.cwd(), "data", "news-db.json");
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min cache

// ============================================================
// In-memory cache
// ============================================================
let cache: { data: WeeklyNews; timestamp: number } | null = null;

// ============================================================
// RSS Sources (official Chinese media)
// ============================================================
const RSS_SOURCES = [
  { name: "人民网·科技", url: "http://www.people.com.cn/rss/tech.xml" },
  { name: "新华网", url: "http://www.xinhuanet.com/politics/xhll.xml" },
];

// ============================================================
// Database I/O
// ============================================================

function loadDB(): NewsItem[] {
  try {
    if (!existsSync(DB_PATH)) return [];
    const raw = readFileSync(DB_PATH, "utf-8");
    const items: NewsItem[] = JSON.parse(raw);
    // Validate and normalize stars
    return items.map(normalizeItem);
  } catch {
    return [];
  }
}

function saveDB(items: NewsItem[]): void {
  // Ensure directory exists
  const dir = join(process.cwd(), "data");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(DB_PATH, JSON.stringify(items, null, 2), "utf-8");
}

function normalizeItem(item: Partial<NewsItem> & { stars?: unknown }): NewsItem {
  const stars = typeof item.stars === "number" && item.stars >= 0 && item.stars <= 5
    ? (Math.round(item.stars) as StarRating)
    : 0;
  return {
    title: item.title || "",
    summary: item.summary || "",
    image: item.image || undefined,
    source: item.source || "未知来源",
    url: item.url || "",
    publishedAt: item.publishedAt || new Date().toISOString(),
    stars,
    ...(item.audio ? { audio: item.audio } : {}),
  };
}

// ============================================================
// Database Management — 250-cap with star protection
// ============================================================

/**
 * Enforce the 5% star cap: if more than 5% of items have stars > 0,
 * demote the lowest-starred items (closest to 0) until within cap.
 */
function enforceStarCap(items: NewsItem[]): NewsItem[] {
  const maxStarred = Math.floor(items.length * MAX_STAR_PERCENT);
  const starredIndices = items
    .map((item, i) => ({ i, stars: item.stars }))
    .filter(({ stars }) => stars > 0)
    .sort((a, b) => a.stars - b.stars); // lowest stars first

  if (starredIndices.length <= maxStarred) return items;

  // Demote excess lowest-starred items to 0
  const toDemote = starredIndices.slice(0, starredIndices.length - maxStarred);
  const newItems = [...items];
  for (const { i } of toDemote) {
    newItems[i] = { ...newItems[i], stars: 0 as StarRating };
  }
  return newItems;
}

/**
 * Evict oldest unstarred items when DB exceeds MAX_CAPACITY.
 * 5-star items are NEVER auto-evicted (classical/protected).
 * Eviction order: 0-star (oldest first) → 1-star → 2-star → 3-star → 4-star.
 */
function evictOverflow(items: NewsItem[]): NewsItem[] {
  if (items.length <= MAX_CAPACITY) return items;

  const toRemove = items.length - MAX_CAPACITY;
  // Assign eviction priority: lower = evict first
  const withPriority = items.map((item, i) => {
    // 5-star items are protected (priority = Infinity)
    if (item.stars === 5) return { i, priority: Infinity };
    // Lower stars + older = higher eviction priority (lower number)
    const age = Date.now() - new Date(item.publishedAt).getTime();
    return { i, priority: item.stars * 1e15 + age };
  });

  // Sort by priority ascending → lowest priority gets evicted first
  withPriority.sort((a, b) => a.priority - b.priority);

  const evictSet = new Set(withPriority.slice(0, toRemove).map(({ i }) => i));
  return items.filter((_, i) => !evictSet.has(i));
}

/**
 * Merge new items into the database:
 * 1. Deduplicate by URL
 * 2. Add new items with stars=0
 * 3. Enforce star cap
 * 4. Evict overflow
 */
function mergeNews(db: NewsItem[], incoming: NewsItem[]): NewsItem[] {
  const existingUrls = new Set(db.map((item) => item.url));
  const newItems = incoming
    .filter((item) => item.url && !existingUrls.has(item.url))
    .map((item) => normalizeItem({ ...item, stars: 0 as StarRating }));

  if (newItems.length === 0) return db;

  let merged = [...newItems, ...db]; // Newest first

  // Enforce star cap based on new total
  merged = enforceStarCap(merged);

  // Evict if over capacity
  merged = evictOverflow(merged);

  return merged;
}

// ============================================================
// RSS Fetching
// ============================================================

function extractTag(block: string, tag: string): string {
  const cdataRegex = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`,
    "i"
  );
  const cdataMatch = block.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const simpleRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const simpleMatch = block.match(simpleRegex);
  return simpleMatch ? simpleMatch[1].trim() : "";
}

function extractImageFromBlock(block: string): string | null {
  const enclosure = block.match(/<enclosure[^>]*url="([^"]+)"/i);
  if (enclosure) return enclosure[1];
  const media = block.match(/<media:content[^>]*url="([^"]+)"/i);
  if (media) return media[1];
  const img = block.match(/<img[^>]*src="([^"]+)"/i);
  if (img) return img[1];
  return null;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function parseRSSItems(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const description = extractTag(block, "description");
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate");
    const imageUrl = extractImageFromBlock(block);

    if (title && description) {
      items.push({
        title: decodeHTMLEntities(stripTags(title)),
        summary: decodeHTMLEntities(stripTags(description)).slice(0, 200),
        image: imageUrl || undefined,
        source: sourceName,
        url: link || "",
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        stars: 0 as StarRating,
      });
    }
  }

  return items.slice(0, 15);
}

async function fetchRSSSource(name: string, url: string): Promise<NewsItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ScientistWall/1.2; +http://localhost:3000)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSSItems(xml, name);
  } catch {
    return [];
  }
}

// ============================================================
// Helpers
// ============================================================

function getWeekLabel(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime() +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const weekNum = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

// ============================================================
// GET handler
// ============================================================

export async function GET(): Promise<NextResponse> {
  // Check cache
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: { "X-Cache": "HIT", "Cache-Control": "public, max-age=300" },
    });
  }

  // Load existing DB
  let db = loadDB();

  // Try fetching new news from RSS
  for (const source of RSS_SOURCES) {
    const freshItems = await fetchRSSSource(source.name, source.url);
    if (freshItems.length > 0) {
      db = mergeNews(db, freshItems);
      break;
    }
  }

  // If DB is empty (first run or file missing), use initial data
  if (db.length === 0) {
    // The initial news-db.json was pre-populated, so this path
    // is only hit if the file was manually deleted
    db = loadDB(); // Re-read — file should exist from repo
  }

  // Save updated DB (only if RSS added new items)
  if (db.length > 0) {
    try {
      saveDB(db);
    } catch {
      // Read-only filesystem — silent fail
    }
  }

  // Compute stats
  const starred = db.filter((n) => n.stars > 0).length;

  // Sort: 5-star first, then by publishedAt descending
  const sorted = [...db].sort((a, b) => {
    if (a.stars !== b.stars) return b.stars - a.stars;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const data: WeeklyNews = {
    week: getWeekLabel(),
    theme: "中国AI与前沿科技新闻速递",
    items: sorted.slice(0, 20), // Return top 20 for the page
    updatedAt: new Date().toISOString(),
    dbStats: {
      total: db.length,
      starred,
      maxCapacity: MAX_CAPACITY,
    },
  };

  // Update cache
  cache = { data, timestamp: Date.now() };

  return NextResponse.json(data, {
    headers: { "X-Cache": "MISS", "Cache-Control": "public, max-age=300" },
  });
}
