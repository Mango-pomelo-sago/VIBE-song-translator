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

const MOOD_ZH: Record<string, string> = {
  indicatif: "直陈式",
  subjonctif: "虚拟式",
  conditionnel: "条件式",
  impératif: "命令式",
  infinitif: "不定式",
  participe: "分词",
};

const TENSE_ZH: Record<string, string> = {
  présent: "现在时",
  imparfait: "未完成过去时",
  futur: "将来时",
  "passé simple": "简单过去时",
  "plus-que-parfait": "愈过去时",
  passé: "过去",
};

/** tooltip 语法区：中文变位描述，如 « 直陈式现在时 · 第三人称单数 » */
export function describeVerbZh(v: VerbInfo): string {
  if (v.mood === "infinitif") return "不定式";
  const person =
    v.person && v.number
      ? `第${["一", "二", "三"][v.person - 1]}人称${v.number === "pl" ? "复数" : "单数"}`
      : "";
  const mood = MOOD_ZH[v.mood] ?? v.mood;
  const tense = TENSE_ZH[v.tense] ?? v.tense;
  return [mood + tense, person].filter(Boolean).join(" · ");
}

const SHORT_TENSE: Record<string, string> = {
  présent: "prés.",
  imparfait: "impar.",
  futur: "fut.",
  "passé simple": "p.s.",
  "plus-que-parfait": "pqp",
  passé: "passé",
};

const SHORT_MOOD: Record<string, string> = {
  indicatif: "",
  subjonctif: "subj.",
  conditionnel: "cond.",
  impératif: "impér.",
  infinitif: "inf.",
  participe: "part.",
};

/** 歌词内联语法标签：动词 → « prés. 3s »，名词 → « m. pl. » */
export function grammarTag(token: {
  pos: string;
  gender?: "m" | "f" | null;
  number?: "sg" | "pl" | null;
  verb?: VerbInfo | null;
}): string | null {
  const v = token.verb;
  if (v) {
    if (v.mood === "infinitif") return "inf.";
    if (v.mood === "participe") return `part. ${v.tense === "passé" ? "passé" : "prés."}`;
    const mood = SHORT_MOOD[v.mood] || "";
    const tense = SHORT_TENSE[v.tense] ?? v.tense;
    const person = v.person ? `${v.person}${v.number === "pl" ? "p" : "s"}` : "";
    return ["v.", mood, tense, person].filter(Boolean).join(" ");
  }
  const gender = token.gender === "f" ? "f." : token.gender === "m" ? "m." : "";
  const number = token.number === "pl" ? "pl." : "";
  if (token.pos === "NOUN") {
    return ["n.", gender, number].filter(Boolean).join(" ");
  }
  if (token.pos === "ADJ") {
    return ["adj.", gender, number].filter(Boolean).join(" ");
  }
  if (token.pos === "ADV") return "adv.";
  return null;
}
