import type { MorphToken, ProcessedLine } from "@/lib/types";
import { tenseLabelZh } from "./verbs";

/** 本曲语法速览的可点击筛选维度 */
export type GrammarFocus = "m" | "f" | "verb" | "adj" | "b1plus";

export type GrammarSummaryData = {
  /** 去重后的名词/动词/形容词词元数 */
  masculine: number;
  feminine: number;
  verbs: number;
  adjectives: number;
  b1plus: number;
  /** 动词时态分布（按去重原形计） */
  tenses: { label: string; count: number }[];
};

const B1PLUS = new Set(["B1", "B2", "C1"]);

function tokensOf(lines: ProcessedLine[]): MorphToken[] {
  const out: MorphToken[] = [];
  for (const line of lines) {
    if (line.tokens) out.push(...line.tokens);
  }
  return out;
}

function isVerb(t: MorphToken): boolean {
  return t.pos === "VERB" || t.pos === "AUX";
}

/** 某个词是否属于当前语法筛选 */
export function matchesGrammarFocus(t: MorphToken, focus: GrammarFocus): boolean {
  switch (focus) {
    case "m":
      return t.pos === "NOUN" && t.gender === "m";
    case "f":
      return t.pos === "NOUN" && t.gender === "f";
    case "verb":
      return isVerb(t);
    case "adj":
      return t.pos === "ADJ";
    case "b1plus":
      return !!t.level && B1PLUS.has(t.level);
  }
}

/**
 * 汇总本曲语法点。用「去重原形」而不是出现次数，
 * 避免副歌反复出现把数字撑得没有参考价值。
 */
export function summarizeGrammar(lines: ProcessedLine[]): GrammarSummaryData {
  const masculine = new Set<string>();
  const feminine = new Set<string>();
  const verbs = new Set<string>();
  const adjectives = new Set<string>();
  const b1plus = new Set<string>();
  const tenses = new Map<string, Set<string>>();

  for (const t of tokensOf(lines)) {
    if (t.pos === "NOUN") {
      const key = t.basicForm.toLowerCase();
      if (t.gender === "m") masculine.add(key);
      else if (t.gender === "f") feminine.add(key);
    }
    if (isVerb(t)) {
      const key = (t.verb?.infinitive ?? t.basicForm).toLowerCase();
      verbs.add(key);
      if (t.verb) {
        const label = tenseLabelZh(t.verb);
        const set = tenses.get(label) ?? new Set<string>();
        set.add(key);
        tenses.set(label, set);
      }
    }
    if (t.pos === "ADJ") adjectives.add(t.basicForm.toLowerCase());
    if (t.level && B1PLUS.has(t.level)) {
      b1plus.add(`${t.pos}:${t.basicForm.toLowerCase()}`);
    }
  }

  return {
    masculine: masculine.size,
    feminine: feminine.size,
    verbs: verbs.size,
    adjectives: adjectives.size,
    b1plus: b1plus.size,
    tenses: [...tenses.entries()]
      .map(([label, set]) => ({ label, count: set.size }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
  };
}
