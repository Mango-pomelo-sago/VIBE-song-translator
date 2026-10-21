/** 法语意群切分：规则式，按语义块而非逐词 */

import type { Bunsetsu, MorphToken } from "@/lib/types";

/** 固定搭配（键为去掉空格的小写表面形，保留连字符/撇号） */
const COLLOCATIONS = new Set([
  "aurevoir",
  "toutàcoup",
  "entrainde",
  "est-ceque",
  "ilya",
  "parceque",
  "aumoins",
  "detempsentemps",
  "aufait",
  "entoutcas",
  "s'ilteplaît",
  "s'ilvousplaît",
  "jet'aime",
  "jet'aimeaussi",
  "auboutdu",
  "autourd",
  "aujourd'hui",
  "avanttout",
  "biensûr",
  "enfinbref",
  "peut-être",
]);

const MAX_COLLOCATION_TOKENS = 10;

/** 强连接词：从这里开新意群（词本身归入后一个意群） */
const BOUNDARY_CONJ = new Set([
  "et", "mais", "car", "donc", "or", "ni", "puis", "quand", "si", "lorsque",
]);

/** 关系代词：从句另起一个意群 */
const RELATIVE_PRON = new Set([
  "qui", "que", "qu'", "dont", "où", "lequel", "laquelle", "lesquels", "lesquelles",
]);

function isVerb(t: MorphToken): boolean {
  return t.pos === "VERB" || t.pos === "AUX";
}

/** 变位动词（排除不定式与分词），用于判断是否已出现谓语 */
function isFiniteVerb(t: MorphToken): boolean {
  return isVerb(t) && t.verb?.mood !== "infinitif" && t.verb?.mood !== "participe";
}

function lastVerb(tokens: MorphToken[]): MorphToken | null {
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (isVerb(tokens[i])) return tokens[i];
  }
  return null;
}

/**
 * 是否在 t 之前断开。规则只做高置信切分：
 * 关系代词 / 谓语后的新名词短语 / 介词短语 / 第二个谓语 / 主语后的谓语。
 */
function startsNewChunk(current: MorphToken[], t: MorphToken): boolean {
  if (!current.length) return false;
  const last = current[current.length - 1];

  if (t.pos === "PRON" && RELATIVE_PRON.has(t.surface.toLowerCase())) {
    // 「dès que」「avant que」「parce qu'」等连词短语不拆
    const head = t.surface.toLowerCase().replace(/'$/, "");
    if (
      (head === "que" || head === "qu") &&
      (last.pos === "PREP" || last.pos === "ADV" || last.pos === "CONJ")
    ) {
      return false;
    }
    return true;
  }

  if (t.pos === "DET" || t.pos === "NUM") {
    const v = lastVerb(current);
    // 已出现变位谓语（而非助动词+分词）时，冠词开启新的名词短语
    return Boolean(v && isFiniteVerb(v) && last.pos !== "DET");
  }

  if (t.pos === "PREP") {
    if (last.pos === "PREP" || last.pos === "DET") return false;
    // 只由副词构成的片段（beaucoup de…）不拆
    if (current.every((x) => x.pos === "ADV")) return false;
    return current.some((x) => x.content) || isVerb(last);
  }

  if (isFiniteVerb(t)) {
    // 只把「名词主语 + 谓语」拆开：le petit chat | dort；副词+代词不拆
    const hasVerb = current.some(isVerb);
    return (
      !hasVerb &&
      current.some((x) => x.pos === "NOUN" || x.pos === "ADJ")
    );
  }

  if (isVerb(t)) {
    // 复合时态：助动词 + 分词保持在同一意群（Lexique 有时把 est 标为 VER 而非 AUX）
    if (t.verb?.mood === "participe" && current.some(isVerb)) {
      return false;
    }
    const v = lastVerb(current);
    return Boolean(v && isFiniteVerb(v));
  }

  return false;
}

function concatSurfaces(tokens: MorphToken[]): string {
  return tokens.map((t) => t.surface).join("").toLowerCase();
}

/** 在当前位置尝试匹配最长固定搭配 */
function matchCollocation(
  tokens: MorphToken[],
  start: number,
): MorphToken[] | null {
  const max = Math.min(MAX_COLLOCATION_TOKENS, tokens.length - start);
  for (let len = max; len >= 2; len--) {
    const window = tokens.slice(start, start + len);
    // 允许连字符作为搭配内部成分，其他标点不跨越
    if (window.some((t) => t.pos === "PUNCT" && t.surface !== "-")) continue;
    if (COLLOCATIONS.has(concatSurfaces(window))) return window;
  }
  return null;
}

function chunkText(tokens: MorphToken[]): string {
  let out = "";
  tokens.forEach((t, i) => {
    if (i > 0 && t.spaceBefore) out += " ";
    out += t.surface;
  });
  return out;
}

function chunkIpa(tokens: MorphToken[]): string {
  let out = "";
  tokens.forEach((t, i) => {
    if (i > 0) {
      const prev = tokens[i - 1];
      out +=
        prev.liaison && prev.liaison.type !== "forbidden" && prev.liaison.phoneme
          ? `‿${prev.liaison.phoneme}`
          : " ";
    }
    out += t.ipa ?? t.surface;
  });
  return out;
}

function chunkParts(tokens: MorphToken[]): { text: string; head: boolean }[] {
  const parts = tokens.map((t) => ({
    text: t.ipa ?? t.surface,
    head: Boolean(t.content),
    liaison: t.liaison,
  }));
  for (let i = 0; i < parts.length - 1; i++) {
    const l = parts[i];
    if (l.liaison && l.liaison.type !== "forbidden" && l.liaison.phoneme) {
      l.text += `‿${l.liaison.phoneme}`;
    }
  }
  return parts.map(({ text, head }) => ({ text, head }));
}

function makeChunk(tokens: MorphToken[], kind: Bunsetsu["kind"]): Bunsetsu {
  const headIndex = tokens.findIndex((t) => t.content);
  return {
    tokens,
    text: chunkText(tokens),
    romaji: chunkIpa(tokens),
    headIndex,
    romajiParts: chunkParts(tokens),
    kind,
    gloss: null,
  };
}

function classify(tokens: MorphToken[]): NonNullable<Bunsetsu["kind"]> {
  if (tokens.some((t) => t.pos === "VERB" || t.pos === "AUX")) return "vp";
  if (tokens[0]?.pos === "PREP") return "pp";
  if (tokens.some((t) => t.pos === "NOUN" || t.pos === "DET" || t.pos === "ADJ")) {
    return "np";
  }
  return "phrase";
}

/** 把 token 流切成意群；标点断句但不进入意群 */
export function segmentChunks(tokens: MorphToken[]): Bunsetsu[] {
  const chunks: Bunsetsu[] = [];
  let current: MorphToken[] = [];

  const flush = () => {
    if (current.length) {
      chunks.push(makeChunk(current, classify(current)));
      current = [];
    }
  };

  for (let i = 0; i < tokens.length; ) {
    const t = tokens[i];

    if (t.pos === "PUNCT") {
      flush();
      i++;
      continue;
    }

    const collocation = matchCollocation(tokens, i);
    if (collocation) {
      flush();
      chunks.push(makeChunk(collocation, "collocation"));
      i += collocation.length;
      continue;
    }

    if (
      t.pos === "CONJ" &&
      BOUNDARY_CONJ.has(t.surface.toLowerCase()) &&
      current.length
    ) {
      flush();
    } else if (startsNewChunk(current, t)) {
      flush();
    }

    current.push(t);
    i++;
  }
  flush();
  return chunks;
}
