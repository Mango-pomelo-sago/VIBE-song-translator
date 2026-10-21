/** 法语词典：本地 Lexique 结构信息 + 远程 Wiktionary 释义（无 key 可用） */

import type { DictEntry, DictSense } from "@/lib/types";
import { lookupLexicon } from "./lexicon";
import { parseInfover } from "./verbs";

const WIKTIONARY_URL = "https://en.wiktionary.org/api/rest_v1/page/definition";
const CACHE = new Map<string, DictEntry | null>();
const MAX_CACHE = 300;

function stripHtml(html: string): string {
  return html
    // 先整块去掉 style/script，否则 CSS 文本会被当成释义保留
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

type WiktionaryGroup = {
  partOfSpeech?: string;
  language?: string;
  definitions?: Array<{ definition?: string }>;
};

type WiktionaryResult = {
  sense: DictSense | null;
  /** 结果是否可缓存：网络错误 / 429 等临时失败不缓存，下次 hover 再试 */
  cacheable: boolean;
};

/** 同一个 IP 连发请求容易被 Wiktionary 限流，请求之间留出间隔 */
const REQUEST_GAP_MS = 250;
let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const wait = lastRequestAt + REQUEST_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

async function fetchWiktionary(word: string): Promise<WiktionaryResult> {
  await throttle();
  try {
    const res = await fetch(
      `${WIKTIONARY_URL}/${encodeURIComponent(word)}`,
      {
        headers: { "User-Agent": "VIBE-RECORDS/1.0 (lyrics study tool)" },
        signal: AbortSignal.timeout(8000),
      },
    );
    // 404 = 确实没有词条，可缓存；429/5xx/网络错误是临时失败，不能缓存
    if (res.status === 404) return { sense: null, cacheable: true };
    if (!res.ok) return { sense: null, cacheable: false };
    const data = (await res.json()) as Record<string, WiktionaryGroup[]>;
    const groups = data.fr ?? [];
    const definitions: string[] = [];
    const partsOfSpeech: string[] = [];
    for (const g of groups) {
      for (const d of g.definitions ?? []) {
        const text = stripHtml(d.definition ?? "");
        if (!text) continue;
        if (definitions.length < 5) definitions.push(text);
      }
      if (g.partOfSpeech && !partsOfSpeech.includes(g.partOfSpeech)) {
        partsOfSpeech.push(g.partOfSpeech);
      }
    }
    if (definitions.length === 0 && partsOfSpeech.length === 0) {
      return { sense: null, cacheable: true };
    }
    return {
      sense: { english: [], definitions, lang: "en", partsOfSpeech },
      cacheable: true,
    };
  } catch {
    return { sense: null, cacheable: false };
  }
}

/**
 * 查询法语单词。远端失败时仍返回本地词表的结构信息
 * （音标、阴阳性、CEFR、词频、变位），保证离线可用。
 */
export async function lookupFrenchWord(
  word: string,
  lemma?: string | null,
): Promise<DictEntry | null> {
  const key = word.trim().toLowerCase();
  if (!key) return null;
  const cached = CACHE.get(key);
  if (cached !== undefined) return cached;

  const local = lookupLexicon(word) ?? (lemma ? lookupLexicon(lemma) : null);
  const { sense, cacheable } = await fetchWiktionary(local?.lemma ?? word);

  if (!local && !sense && !cacheable) {
    // 远程临时失败：不写缓存，避免把一次超时固化成「查不到」
    return null;
  }
  if (!local && !sense) {
    CACHE.set(key, null);
    return null;
  }

  const entry: DictEntry = {
    word,
    reading: local?.ipa ?? null,
    level: local?.cefr ?? null,
    cefr: local?.cefr ? [local.cefr] : undefined,
    gender: local?.gender ?? null,
    lemma: local?.lemma ?? lemma ?? null,
    frequency: local?.frequency ?? null,
    verb:
      local && (local.cgram === "VER" || local.cgram === "AUX")
        ? parseInfover(local.infover, local.lemma)
        : null,
    senses: sense ? [sense] : [],
    url: `https://fr.wiktionary.org/wiki/${encodeURIComponent(word)}`,
    source: sense ? "wiktionary" : "lexique",
    lang: "fr",
  };

  if (CACHE.size >= MAX_CACHE) {
    const oldest = CACHE.keys().next().value;
    if (oldest !== undefined) CACHE.delete(oldest);
  }
  // 只有拿到确定结果才缓存：远程 429/超时留待下次重试
  if (cacheable) CACHE.set(key, entry);
  return entry;
}

/** 测试用 */
export function clearFrenchDictionaryCache(): void {
  CACHE.clear();
}
