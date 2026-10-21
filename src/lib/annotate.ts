/**
 * AI 异步增强：按 lemma 补充中文释义（本地 IPA/阴阳性/变位/CEFR 永不覆盖）。
 * 服务端重新本地分词，客户端只负责把 gloss 合并回 token。
 */

import { z } from "zod";
import { chat } from "./ai";
import type { ResolvedAiConfig } from "./ai";
import { tokenizeFrench } from "./fr/tokenize";
import { annotateSystemPrompt, annotateUserPrompt } from "./lang/prompts";
import type { LangCode } from "./types";

/** 单首歌最多标注的 lemma 数 */
export const MAX_LEMMAS = 200;
/** 单次请求最多 lemma 数 */
export const BATCH = 60;
/** 单首歌最多 AI 调用次数 */
export const MAX_CALLS = 3;

const LemmaSchema = z.object({
  lemma: z.string(),
  glossZh: z.string(),
  note: z.string().nullish(),
  liaisonToNext: z.enum(["obligatory", "optional", "forbidden"]).nullish(),
  elisionFullForm: z.string().nullish(),
});

export const AnnotationSchema = z.object({
  lemmas: z.array(LemmaSchema),
});

export type LemmaAnnotation = z.infer<typeof LemmaSchema>;
export type Annotation = z.infer<typeof AnnotationSchema>;

const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 天
const MAX_SONGS = 50;

type CacheEntry = { value: LemmaAnnotation[]; expiresAt: number };
const CACHE = new Map<string, CacheEntry>();

function textHash(text: string): string {
  // 轻量稳定 hash（FNV-1a），仅用于缓存键，不作为安全用途
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function cacheKey(
  songId: number,
  hash: string,
  config?: ResolvedAiConfig,
): string {
  const base = `annotate:fr:${songId}:${hash}`;
  return config ? `${base}:${config.baseUrl}|${config.model}` : base;
}

function cacheGet(key: string): LemmaAnnotation[] | null {
  const e = CACHE.get(key);
  if (!e) return null;
  if (e.expiresAt <= Date.now()) {
    CACHE.delete(key);
    return null;
  }
  return e.value;
}

function cacheSet(key: string, value: LemmaAnnotation[]) {
  if (CACHE.size >= MAX_SONGS) {
    const oldest = CACHE.keys().next().value;
    if (oldest !== undefined) CACHE.delete(oldest);
  }
  CACHE.set(key, { value, expiresAt: Date.now() + CACHE_TTL });
}

/** 本地分词后按 lemma 去重（只取内容词），供 AI 标注 */
export function collectLemmas(lines: Array<{ text: string }>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of lines) {
    if (!l.text?.trim()) continue;
    for (const t of tokenizeFrench(l.text)) {
      if (!t.content) continue;
      const key = t.basicForm.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(t.basicForm);
      if (out.length >= MAX_LEMMAS) return out;
    }
  }
  return out;
}

function parseResponse(raw: string): LemmaAnnotation[] {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw);
    if (!fence) throw new Error("annotate: 响应不是 JSON");
    json = JSON.parse(fence[1]);
  }
  return AnnotationSchema.parse(json).lemmas;
}

/**
 * 为法语歌词生成 lemma 释义。未配置 key 时抛 AiNotConfiguredError。
 * 返回顺序与输入 lemma 去重顺序一致（漏掉的 lemma 不包含）。
 */
export async function annotateLyrics(
  songId: number,
  lines: Array<{ text: string }>,
  config?: ResolvedAiConfig,
  lang: LangCode = "fr",
): Promise<LemmaAnnotation[]> {
  if (lang !== "fr") return [];
  const lemmas = collectLemmas(lines);
  if (lemmas.length === 0) return [];

  const key = cacheKey(songId, textHash(lemmas.join("|")), config);
  const cached = cacheGet(key);
  if (cached) return cached;

  const result: LemmaAnnotation[] = [];
  const batches = Math.min(MAX_CALLS, Math.ceil(lemmas.length / BATCH));
  for (let i = 0; i < batches; i++) {
    const chunk = lemmas.slice(i * BATCH, (i + 1) * BATCH);
    if (chunk.length === 0) break;
    const raw = await chat(
      [
        { role: "system", content: annotateSystemPrompt(lang) },
        { role: "user", content: annotateUserPrompt(chunk) },
      ],
      { temperature: 0.2, json: true, maxTokens: 2500, config },
    );
    for (const item of parseResponse(raw)) {
      // 只接受请求过的 lemma，避免模型自由发挥
      if (chunk.includes(item.lemma)) result.push(item);
    }
  }

  cacheSet(key, result);
  return result;
}

/** 清空缓存（测试用） */
export function clearAnnotateCache(): void {
  CACHE.clear();
}
