import type { VerbInfo } from "@/lib/types";

/** Lexique383 infover 语式代码 → 展示名 */
const MOODS: Record<string, string> = {
  ind: "indicatif",
  sub: "subjonctif",
  // Lexique 用 cnd 表示条件式（con 为旧拼写，一并兼容）
  cnd: "conditionnel",
  con: "conditionnel",
  imp: "impératif",
  inf: "infinitif",
  par: "participe",
};

const TENSES: Record<string, string> = {
  pre: "présent",
  imp: "imparfait",
  fut: "futur",
  pas: "passé simple",
  pqp: "plus-que-parfait",
};

/**
 * 解析 Lexique 的 infover，例如 `ind:pre:3s`、`par:pas`、`inf`。
 * 无法识别时返回 null（UI 只显示原形，不编造变位）。
 */
export function parseInfover(
  infover: string | null | undefined,
  infinitive: string,
): VerbInfo | null {
  const raw = (infover ?? "").trim();
  if (!raw) return null;
  const [mode, tense, person] = raw.split(":");

  if (mode === "inf") {
    return { infinitive, mood: "infinitif", tense: "présent", person: null, number: null };
  }

  const mood = MOODS[mode];
  if (!mood) return null;

  if (mode === "par") {
    return {
      infinitive,
      mood: "participe",
      tense: tense === "pas" ? "passé" : tense === "pre" ? "présent" : "participe",
      person: null,
      number: null,
    };
  }

  const p = /^([123])([sp])$/.exec(person ?? "");
  return {
    infinitive,
    mood,
    tense: TENSES[tense] ?? tense ?? "",
    person: p ? (Number(p[1]) as 1 | 2 | 3) : null,
    number: p ? (p[2] === "s" ? "sg" : "pl") : null,
  };
}

/** 给 tooltip 用的简短变位描述，如 « indicatif présent · 1re pers. sg » */
export function describeVerb(v: VerbInfo): string {
  const person =
    v.person && v.number
      ? `${v.person === 1 ? "1re" : `${v.person}e`} pers. ${v.number}`
      : "";
  return [v.mood, v.tense, person].filter(Boolean).join(" · ");
}
