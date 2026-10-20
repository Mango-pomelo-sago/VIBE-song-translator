import { z } from "zod";
import { chat, isConfigured } from "./ai";
import type { ResolvedAiConfig } from "./ai";

/**
 * AI 文化/语法学习笔记：
 * 每首歌一次 DeepSeek 调用，Zod 校验结构化返回，服务端内存缓存（TTL 30 天）。
 */

const CulturalSchema = z.object({
  /** 文化关键词/意象，如「花火」 */
  snippet: z.string(),
  /** 小节标题 */
  title: z.string(),
  /** 2-3 句话解释 */
  detail: z.string(),
});

const GrammarSchema = z.object({
  /** 句型，如「〜てしまう」 */
  pattern: z.string(),
  /** 意思 */
  meaning: z.string(),
  /** 接续/规则 */
  rule: z.string(),
  /** 歌词例句原文 */
  example: z.string(),
  /** 例句翻译 */
  translation: z.string(),
});

export const LearningNotesSchema = z.object({
  /** 歌曲背景/主题/意象总览 */
  background: z.string(),
  cultural: z.array(CulturalSchema),
  grammar: z.array(GrammarSchema),
});

export type LearningNotes = z.infer<typeof LearningNotesSchema>;

const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 天
const MAX_SONGS = 50;
const MAX_LINES = 25; // 喂给 AI 的歌词行数上限

type CacheEntry = { value: LearningNotes; expiresAt: number };
const CACHE = new Map<string, CacheEntry>();

/** 缓存指纹：只含供应商与模型（绝不含 key）；未传 config 时保持旧键。 */
function cacheKey(songId: number, config?: ResolvedAiConfig): string {
  const base = `notes:${songId}`;
  return config ? `${base}:${config.baseUrl}|${config.model}` : base;
}

export function hasNotesCache(
  songId: number,
  config?: ResolvedAiConfig,
): boolean {
  const e = CACHE.get(cacheKey(songId, config));
  return !!e && e.expiresAt > Date.now();
}

function cacheSet(key: string, notes: LearningNotes) {
  if (CACHE.size >= MAX_SONGS) {
    const oldest = CACHE.keys().next().value;
    if (oldest !== undefined) CACHE.delete(oldest);
  }
  CACHE.set(key, { value: notes, expiresAt: Date.now() + CACHE_TTL });
}

function cacheGet(key: string): LearningNotes | null {
  const e = CACHE.get(key);
  if (!e) return null;
  if (e.expiresAt <= Date.now()) {
    CACHE.delete(key);
    return null;
  }
  return e.value;
}

/** 从 raw JSON 解析并校验；失败抛错（调用方决定是否重试） */
export function parseNotes(raw: string): LearningNotes {
  const json = JSON.parse(raw) as unknown;
  return LearningNotesSchema.parse(json);
}

const SYSTEM_PROMPT =
  "你是资深日语老师兼日本文化向导。根据用户提供的日文歌词生成中文学习笔记，" +
  "必须严格按 JSON 结构输出，cultural 与 grammar 的例句必须真实来自歌词，不得编造。" +
  "输出 JSON：{" +
  '"background":"歌曲背景/主题/意象总览，2-3 句",' +
  '"cultural":[{"snippet":"文化关键词","title":"小节标题","detail":"2-3 句解释"}],' +
  '"grammar":[{"pattern":"句型","meaning":"意思","rule":"接续规则","example":"歌词例句原文","translation":"例句翻译"}]' +
  "}";

function buildUserPrompt(
  title: string,
  artist: string,
  lyricText: string,
): string {
  return (
    `歌名：${title}${artist ? `（歌手：${artist}）` : ""}\n歌词：\n${lyricText}\n\n` +
    "请生成学习笔记 JSON：cultural 2-4 条，grammar 3-5 条。" +
    '返回格式（唯一）：{"background":...,"cultural":[...],"grammar":[...]}'
  );
}

/** 生成并缓存某首歌的学习笔记。未配置 key 抛 AiNotConfiguredError。 */
export async function generateNotes(
  song: { id: number; name: string },
  artist: string,
  lines: Array<{ text: string }>,
  config?: ResolvedAiConfig,
): Promise<LearningNotes> {
  const key = cacheKey(song.id, config);
  const cached = cacheGet(key);
  if (cached) return cached;

  const lyricText = lines
    .map((l) => l.text)
    .filter((t) => t && t.trim())
    .slice(0, MAX_LINES)
    .join("\n");
  if (!lyricText) throw new Error("notes: 歌词为空");

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: buildUserPrompt(song.name, artist, lyricText) },
  ];

  let raw = await chat(messages, {
    temperature: 0.4,
    json: true,
    maxTokens: 2500,
    config,
  });
  let notes: LearningNotes | null = null;
  try {
    notes = parseNotes(raw);
  } catch {
    // 模型输出不合法：再给一次机会，强调只输出 JSON
    raw = await chat(
      [
        ...messages,
        {
          role: "assistant" as const,
          content: raw,
        },
        {
          role: "user" as const,
          content:
            "你上次的输出不是合法 JSON。请重新只输出符合要求的 JSON，不要任何额外文字。",
        },
      ],
      { temperature: 0.2, json: true, maxTokens: 2500, config },
    );
    notes = parseNotes(raw);
  }

  cacheSet(key, notes);
  return notes;
}

/** 清空缓存（测试用） */
export function clearNotesCache(): void {
  CACHE.clear();
}

export { isConfigured };
