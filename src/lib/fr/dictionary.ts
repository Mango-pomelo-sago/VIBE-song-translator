/** 法语词典：本地 Lexique 结构信息 + 远程 Wiktionary 释义（无 key 可用） */

import type { DictEntry, DictSense } from "@/lib/types";
import { lookupLexicon } from "./lexicon";
import { parseInfover } from "./verbs";

const WIKTIONARY_URL = "https://en.wiktionary.org/api/rest_v1/page/definition";
const CACHE = new Map<string, DictEntry | null>();
const MAX_CACHE = 300;

function stripHtml(html: string): string {
  return html
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

async function fetchWiktionary(word: string): Promise<DictSense | null> {
  try {
    const res = await fetch(
      `${WIKTIONARY_URL}/${encodeURIComponent(word)}`,
      {
        headers: { "User-Agent": "VIBE-RECORDS/1.0 (lyrics study tool)" },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return null;
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
    if (definitions.length === 0 && partsOfSpeech.length === 0) return null;
    return { english: [], definitions, lang: "en", partsOfSpeech };
  } catch {
    return null;
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
  const sense = await fetchWiktionary(local?.lemma ?? word);

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
  CACHE.set(key, entry);
  return entry;
}

/** 测试用 */
export function clearFrenchDictionaryCache(): void {
  CACHE.clear();
}
