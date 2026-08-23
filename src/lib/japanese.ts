import path from "path";
import { existsSync } from "fs";
import kuromoji from "kuromoji";
import { toHiragana } from "wanakana";
import { alignSurfaceToReading } from "./align";
import { tokenRomaji } from "./romaji";
import type { MorphToken } from "./types";

/**
 * kuromoji 形态素解析（服务端专用）。
 * module-level Promise 单例：词典 ~4MB，只加载一次，不进前端 bundle。
 */

type KuromojiToken = {
  surface_form: string;
  basic_form?: string;
  reading?: string;
  pos?: string;
  pos_detail_1?: string;
};

type Tokenizer = { tokenize: (text: string) => KuromojiToken[] };

let tokenizerPromise: Promise<Tokenizer> | null = null;

function resolveDictPath(): string {
  // 首选 node_modules（dev / 本地 / Vercel + outputFileTracingIncludes）；
  // 缺失时退回 public/kuromoji-dict 副本（node_modules 未被打包的部署环境）。
  const primary = path.join(process.cwd(), "node_modules", "kuromoji", "dict");
  if (existsSync(path.join(primary, "base.dat.gz"))) return primary;
  const fallback = path.join(process.cwd(), "public", "kuromoji-dict");
  if (existsSync(path.join(fallback, "base.dat.gz"))) return fallback;
  return primary; // 都不存在：让 builder 报错，由调用方兜底
}

function buildTokenizer(): Promise<Tokenizer> {
  return new Promise<Tokenizer>((resolve, reject) => {
    const dicPath = resolveDictPath();
    kuromoji.builder({ dicPath }).build((err, tokenizer) => {
      if (err) reject(err);
      else resolve(tokenizer as unknown as Tokenizer);
    });
  });
}

function getTokenizer(): Promise<Tokenizer> {
  if (!tokenizerPromise) tokenizerPromise = buildTokenizer();
  return tokenizerPromise;
}

function toMorphToken(t: KuromojiToken): MorphToken {
  const surface = t.surface_form;
  const reading = t.reading ? toHiragana(t.reading) : null;
  const pos = t.pos ?? "未知";
  const { segments, warnings } = alignSurfaceToReading(surface, reading);

  return {
    surface,
    reading,
    basicForm: t.basic_form || surface,
    pos,
    posDetail: t.pos_detail_1 ?? "",
    ruby: segments,
    romaji: tokenRomaji(reading, surface, pos),
    warnings,
  };
}

/**
 * 常见读音修正：kuromoji 字典对部分高频词会字面直读（二人 → 二+人 = に+にん），
 * 而歌词语境几乎都是训读（ふたり）。key 为完整 surface。
 * 匹配支持跨 token 合并（相邻 token 表面形拼接命中时合并为一个 token），
 * 例如 二[に]+人[にん] → 二人[ふたり]。不会误伤 二人三脚 等独立 surface。
 */
export const READING_OVERRIDES: Record<string, string> = {
  二人: "ふたり",
  一人: "ひとり",
  二人きり: "ふたりきり",
  二人暮らし: "ふたりぐらし",
  二人乗り: "ふたりのり",
};

const OVERRIDE_MAX_LEN = 3;

function buildOverrideToken(span: MorphToken[], reading: string): MorphToken {
  const surface = span.map((t) => t.surface).join("");
  if (span.length === 1 && span[0].reading === reading) return span[0];
  const { segments, warnings } = alignSurfaceToReading(surface, reading);
  return {
    surface,
    reading,
    basicForm: surface,
    pos: span[0].pos,
    posDetail: span[0].posDetail,
    ruby: segments,
    romaji: tokenRomaji(reading, surface, span[0].pos),
    warnings,
  };
}

/** 对分词结果应用读音覆盖并重建 ruby / romaji（纯函数，可单测） */
export function applyReadingOverrides(tokens: MorphToken[]): MorphToken[] {
  const out: MorphToken[] = [];
  let i = 0;
  while (i < tokens.length) {
    const maxLen = Math.min(OVERRIDE_MAX_LEN, tokens.length - i);
    let merged: MorphToken | null = null;
    let spanLen = 0;
    for (let len = maxLen; len >= 1; len--) {
      const span = tokens.slice(i, i + len);
      const surface = span.map((t) => t.surface).join("");
      const override = READING_OVERRIDES[surface];
      if (override) {
        merged = buildOverrideToken(span, override);
        spanLen = len;
        break;
      }
    }
    if (merged && spanLen) {
      out.push(merged);
      i += spanLen;
    } else {
      out.push(tokens[i]);
      i++;
    }
  }
  return out;
}

/** 逐行分词（服务端调用，返回 MorphToken[]） */
export async function tokenizeLine(line: string): Promise<MorphToken[]> {
  const tokenizer = await getTokenizer();
  return applyReadingOverrides(tokenizer.tokenize(line).map(toMorphToken));
}
