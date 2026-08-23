import type { DictEntry } from "./types";

/**
 * Jisho 词典查询（服务端）：
 * 内存 LRU 缓存 + 并发 1 限流 + ≥250ms 间隔 + 429/5xx 失败黑名单（60s 后重试）。
 */

const JISHO_URL = "https://jisho.org/api/v1/search/words";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const MIN_GAP = 250;
const MAX_CACHE = 300;

type JishoRaw = {
  data?: Array<{
    slug: string;
    is_common?: boolean;
    japanese?: Array<{ word?: string; reading?: string }>;
    senses?: Array<{
      english_definitions?: string[];
      parts_of_speech?: string[];
    }>;
    jlpt?: string[];
  }>;
};

const CACHE = new Map<string, DictEntry | null>();
const FAILED = new Set<string>();
let queueTail: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

function mapEntry(word: string, raw: NonNullable<JishoRaw["data"]>[number]): DictEntry {
  const jp = raw.japanese?.[0];
  const jlpt = (raw.jlpt ?? [])
    .map((t) => /^jlpt-(n[1-5])$/i.exec(t)?.[1]?.toUpperCase())
    .filter((t): t is string => !!t);
  return {
    word: jp?.word ?? raw.slug,
    reading: jp?.reading ?? null,
    jlpt,
    isCommon: raw.is_common ?? false,
    senses: (raw.senses ?? []).slice(0, 5).map((s) => ({
      english: s.english_definitions ?? [],
      partsOfSpeech: s.parts_of_speech ?? [],
    })),
    url: `https://jisho.org/search/${encodeURIComponent(word)}`,
    source: "jisho",
  };
}

async function fetchJisho(word: string): Promise<DictEntry | null> {
  const url = `${JISHO_URL}?keyword=${encodeURIComponent(word)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 429) throw new Error("jisho rate-limited");
  if (!res.ok) throw new Error(`jisho http ${res.status}`);
  const json = (await res.json()) as JishoRaw;
  const first = json.data?.[0];
  if (!first) return null;
  return mapEntry(word, first);
}

/** 查询一个词；查无返回 null。失败（网络/429/5xx）返回 null 并短期黑名单。 */
export function lookup(word: string): Promise<DictEntry | null> {
  const clean = word.trim();
  if (!clean || FAILED.has(clean)) return Promise.resolve(null);
  const hit = CACHE.get(clean);
  if (hit !== undefined) return Promise.resolve(hit);

  // 排队：等前一个请求完成，且距上次请求 ≥250ms
  const start = async (): Promise<DictEntry | null> => {
    await queueTail;
    const wait = lastRequestAt + MIN_GAP - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();

    let entry: DictEntry | null = null;
    try {
      entry = await fetchJisho(clean);
    } catch {
      FAILED.add(clean);
      setTimeout(() => FAILED.delete(clean), 60_000);
    }
    if (CACHE.size >= MAX_CACHE) {
      const oldest = CACHE.keys().next().value;
      if (oldest !== undefined) CACHE.delete(oldest);
    }
    CACHE.set(clean, entry);
    return entry;
  };

  const p = start();
  queueTail = p.then(
    () => undefined,
    () => undefined,
  );
  return p;
}

/** 按表面形查，miss 时用基本形重查 */
export async function lookupWithFallback(
  surface: string,
  basicForm?: string | null,
): Promise<DictEntry | null> {
  const direct = await lookup(surface);
  if (direct) return direct;
  if (basicForm && basicForm !== surface) return lookup(basicForm);
  return null;
}
