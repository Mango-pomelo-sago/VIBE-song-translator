import { chat } from "./ai";
import type { ResolvedAiConfig } from "./ai";
import type { NeteaseSong } from "./types";

/** 待翻译的一行（缺失 tlyric） */
export type MissingLine = { index: number; text: string };

/** index → 中文翻译 */
export type TranslationMap = Map<number, string>;

const CHUNK = 25; // 每块行数，避免单次超长 / 截断
const HARD_LIMIT = 120; // 每曲硬上限（成本护栏）
const MAX_SONGS = 40; // 服务端内存缓存歌曲数

// 服务端内存缓存：translate:{songId}[:{baseUrl}|{model}] → TranslationMap
const CACHE = new Map<string, TranslationMap>();

/** 缓存指纹：只含供应商与模型（绝不含 key）；未传 config 时保持旧键。 */
function cacheKey(songId: number, config?: ResolvedAiConfig): string {
  const base = `translate:${songId}`;
  return config ? `${base}:${config.baseUrl}|${config.model}` : base;
}

const SYSTEM_PROMPT =
  "你是专业的日文歌词翻译。将用户提供的每行日文歌词翻译成简体中文。" +
  "要求：1) 只翻译，不解释、不加行；2) 保持情感和意境，口语化自然；" +
  "3) 严格按用户编号对应输出，不得遗漏、不得合并、不得编号错误。";

function buildUserPrompt(songName: string, artists: string, lines: MissingLine[]): string {
  const header = `歌名：${songName}${artists ? `（歌手：${artists}）` : ""}\n请翻译以下歌词行：`;
  const body = lines.map((l) => `${l.index}\t${l.text}`).join("\n");
  return header + "\n" + body;
}

function parseResponse(raw: string): TranslationMap {
  const out: TranslationMap = new Map();
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    // 容忍模型把 JSON 包在 ```json 代码块里
    const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw);
    if (!fence) throw new Error("translate: 响应不是 JSON");
    json = JSON.parse(fence[1]);
  }
  const list = (json as { translations?: Array<{ index?: unknown; zh?: unknown }> })
    ?.translations;
  if (!Array.isArray(list)) throw new Error("translate: 缺 translations 数组");
  for (const item of list) {
    const idx = Number(item?.index);
    const zh = typeof item?.zh === "string" ? item.zh.trim() : "";
    if (!Number.isInteger(idx) || !zh) continue;
    out.set(idx, zh);
  }
  return out;
}

/** 翻译缺失行；返回 index→zh 映射（AI 漏译的 index 不包含在内）。未配置 key 抛 AiNotConfiguredError。 */
export async function translateMissingLines(
  song: Pick<NeteaseSong, "id" | "name">,
  artists: string,
  missing: MissingLine[],
  config?: ResolvedAiConfig,
): Promise<TranslationMap> {
  // 去重 + 去空行 + 硬上限
  const seen = new Set<number>();
  const uniq = missing.filter((m) => {
    const key = m.index;
    if (seen.has(key) || !m.text || !m.text.trim()) return false;
    seen.add(key);
    return true;
  });
  if (uniq.length === 0) return new Map();
  const capped = uniq.slice(0, HARD_LIMIT);

  const key = cacheKey(song.id, config);
  const cached = CACHE.get(key);
  if (cached) return cached;

  const result: TranslationMap = new Map();
  for (let i = 0; i < capped.length; i += CHUNK) {
    const chunk = capped.slice(i, i + CHUNK);
    const raw = await chat(
      [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content:
            buildUserPrompt(song.name, artists, chunk) +
            '\n请以 JSON 返回：{"translations":[{"index":<编号>,"zh":"翻译"}]}',
        },
      ],
      { temperature: 0.2, json: true, maxTokens: 2000, config },
    );
    for (const [idx, zh] of parseResponse(raw)) {
      result.set(idx, zh);
    }
  }

  if (result.size > 0) {
    if (CACHE.size >= MAX_SONGS) {
      const oldest = CACHE.keys().next().value;
      if (oldest !== undefined) CACHE.delete(oldest);
    }
    CACHE.set(key, result);
  }
  return result;
}

export function hasTranslateCache(
  songId: number,
  config?: ResolvedAiConfig,
): boolean {
  return CACHE.has(cacheKey(songId, config));
}

/** 清空缓存（测试用） */
export function clearTranslateCache(): void {
  CACHE.clear();
}
