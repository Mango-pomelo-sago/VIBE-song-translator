/** 法语离线词表：运行时从 src/data/fr/lexicon.json 读取（仅服务端） */

import { readFileSync } from "node:fs";
import path from "node:path";
import type { CefrLevel, Gender } from "@/lib/types";

/**
 * 行格式（由 scripts/build-fr-lexicon.mjs 生成）：
 * [lemma, cgram, genre, nombre, ipa, freqPerMillion, infover, cefr]
 */
export type LexRow = [
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  string,
];

export type LexEntry = {
  lemma: string;
  /** Lexique 词性，如 NOM / VER / ADJ:num / PRO:per */
  cgram: string;
  gender: Gender | null;
  nombre: "sg" | "pl" | null;
  /** 国际音标；缺失为 null */
  ipa: string | null;
  /** 每百万词频 */
  frequency: number;
  /** Lexique 屈折代码，如 ind:pre:3s */
  infover: string;
  /** 按词频估算的 CEFR 等级 */
  cefr: CefrLevel | null;
};

let rowsCache: Record<string, LexRow> | null = null;

function rows(): Record<string, LexRow> {
  if (rowsCache) return rowsCache;
  const file = path.join(process.cwd(), "src", "data", "fr", "lexicon.json");
  const parsed = JSON.parse(readFileSync(file, "utf8")) as {
    rows: Record<string, LexRow>;
  };
  rowsCache = parsed.rows;
  return rowsCache;
}

export function normalizeWord(word: string): string {
  return word.normalize("NFC").toLowerCase();
}

/** 查询一个词形（大小写不敏感）；未收录返回 null */
export function lookupLexicon(word: string): LexEntry | null {
  const key = normalizeWord(word).trim();
  if (!key) return null;
  const row = rows()[key];
  if (!row) return null;
  const [lemma, cgram, genre, nombre, ipa, frequency, infover, cefr] = row;
  return {
    lemma: lemma || key,
    cgram,
    gender: genre === "m" || genre === "f" ? genre : null,
    // 生成脚本沿用 Lexique 的 s/p 缩写，兼容部分旧数据的 sg/pl
    nombre:
      nombre === "s" || nombre === "sg"
        ? "sg"
        : nombre === "p" || nombre === "pl"
          ? "pl"
          : null,
    ipa: ipa || null,
    frequency: typeof frequency === "number" ? frequency : 0,
    infover,
    cefr: /^(A1|A2|B1|B2|C1)$/.test(cefr) ? (cefr as CefrLevel) : null,
  };
}

/** 测试/脚本用：词表规模 */
export function lexiconSize(): number {
  return Object.keys(rows()).length;
}

/** 测试用：注入 fixture，避免读 5MB 文件时依赖真实数据 */
export function __setLexiconForTest(fixture: Record<string, LexRow> | null): void {
  rowsCache = fixture;
}
