/** 法语分词：Intl.Segmenter + 省音/标点后处理，纯本地同步 */

import type { MorphToken, RubySegment } from "@/lib/types";
import { isContentPos } from "@/lib/lang/meta";
import { lookupLexicon, type LexEntry } from "./lexicon";
import { parseInfover } from "./verbs";

const SEGMENTER = new Intl.Segmenter("fr", { granularity: "word" });

/** 省音前缀 → 完整形式 */
const CLITIC_FULL: Record<string, string> = {
  j: "je",
  l: "le",
  d: "de",
  qu: "que",
  n: "ne",
  s: "se",
  c: "ce",
  m: "me",
  t: "te",
  jusqu: "jusque",
  lorsqu: "lorsque",
  puisqu: "puisque",
  quoiqu: "quoique",
};

/** 不拆分的词：省音是词形的一部分 */
const NO_SPLIT = new Set([
  "aujourd'hui",
  "quelqu'un",
  "quelqu'une",
  "presqu'île",
  "entr'acte",
]);

const ELISION_RE = /^(qu|jusqu|lorsqu|puisqu|quoiqu|[cdjlmnst])'(.+)$/i;

/** Lexique cgram 主类 → 通用词性 */
const CGRAM_POS: Record<string, string> = {
  NOM: "NOUN",
  VER: "VERB",
  AUX: "AUX",
  ADJ: "ADJ",
  ADV: "ADV",
  PRO: "PRON",
  ART: "DET",
  DET: "DET",
  PRE: "PREP",
  CON: "CONJ",
  ONO: "INTJ",
  INT: "INTJ",
  NUM: "NUM",
};

export function mapCgram(cgram: string): string {
  return CGRAM_POS[cgram.split(":")[0]] ?? "UNK";
}

/** NFC、直引号归一、NBSP → 普通空格（保证 offset 与原文一致） */
export function normalizeFrench(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[’ʼ]/g, "'")
    .replace(/[  ]/g, " ");
}

function rubyFor(surface: string, ipa: string | null): RubySegment[] {
  return ipa ? [{ text: surface, reading: ipa, kind: "ipa" }] : [];
}

type BuiltToken = Omit<MorphToken, "spaceBefore">;

function tokenFromEntry(surface: string, entry: LexEntry | null): BuiltToken {
  if (!entry) {
    return {
      surface,
      reading: null,
      basicForm: surface,
      pos: "UNK",
      posDetail: "",
      ruby: [],
      romaji: null,
      content: false,
      ipa: null,
      level: null,
      frequency: null,
      gender: null,
      number: null,
      verb: null,
    };
  }

  const pos = mapCgram(entry.cgram);
  const showsAgreement = pos === "NOUN" || pos === "ADJ";
  const isVerb = pos === "VERB" || pos === "AUX";

  return {
    surface,
    reading: null,
    basicForm: entry.lemma,
    pos,
    posDetail: entry.infover,
    ruby: rubyFor(surface, entry.ipa),
    romaji: null,
    content: isContentPos("fr", pos),
    ipa: entry.ipa,
    level: entry.cefr,
    frequency: entry.frequency,
    gender: showsAgreement ? entry.gender : null,
    number: showsAgreement ? entry.nombre : null,
    verb: isVerb ? parseInfover(entry.infover, entry.lemma) : null,
  };
}

function cliticToken(surface: string, clitic: string): BuiltToken {
  const fullForm = CLITIC_FULL[clitic.toLowerCase()] ?? clitic;
  const own = lookupLexicon(surface) ?? lookupLexicon(fullForm);
  const base = tokenFromEntry(surface, own);
  // 省音形式读作辅音，去掉词尾 schwa：je /ʒə/ → j' /ʒ/
  const ipa = base.ipa?.endsWith("ə") ? base.ipa.slice(0, -1) : base.ipa ?? null;
  return {
    ...base,
    basicForm: own?.lemma ?? fullForm,
    ruby: rubyFor(surface, ipa),
    ipa,
    elision: { fullForm },
    content: false,
  };
}

function punctToken(surface: string): BuiltToken {
  return {
    surface,
    reading: null,
    basicForm: surface,
    pos: "PUNCT",
    posDetail: "",
    ruby: [],
    romaji: null,
    content: false,
    ipa: null,
    level: null,
    frequency: null,
    gender: null,
    number: null,
    verb: null,
  };
}

/** 把一个 word segment 拆成省音片段；返回 [文本, 相对 offset] */
export function splitWord(segment: string): Array<{ text: string; offset: number }> {
  const lower = segment.toLowerCase();
  if (NO_SPLIT.has(lower)) return [{ text: segment, offset: 0 }];
  const m = ELISION_RE.exec(segment);
  if (!m) return [{ text: segment, offset: 0 }];
  const prefix = `${m[1]}'`;
  return [
    { text: prefix, offset: 0 },
    { text: m[2], offset: prefix.length },
  ];
}

/**
 * 分词并标注。返回的 token 覆盖所有非空白字符；
 * `spaceBefore` 由原文 offset 计算，渲染时可原样还原空格。
 */
export function tokenizeFrench(text: string): MorphToken[] {
  const normalized = normalizeFrench(text);
  const tokens: MorphToken[] = [];
  let cursor = 0;

  for (const seg of SEGMENTER.segment(normalized)) {
    if (/^\s*$/.test(seg.segment)) continue;
    const start = seg.index;
    const end = start + seg.segment.length;

    if (seg.isWordLike) {
      const parts = splitWord(seg.segment);
      for (const part of parts) {
        const absStart = start + part.offset;
        const absEnd = absStart + part.text.length;
        const lower = part.text.toLowerCase();
        const isElided = lower.endsWith("'") && parts.length > 1;
        const built = isElided
          ? cliticToken(part.text, lower.slice(0, -1))
          : tokenFromEntry(part.text, lookupLexicon(part.text));
        tokens.push({
          ...built,
          spaceBefore: /\s/.test(normalized.slice(cursor, absStart)),
        });
        cursor = absEnd;
      }
    } else {
      tokens.push({
        ...punctToken(seg.segment),
        spaceBefore: /\s/.test(normalized.slice(cursor, start)),
      });
      cursor = end;
    }
  }

  return tokens;
}
