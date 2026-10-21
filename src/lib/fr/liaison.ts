/** 法语联诵规则：高置信度只标「必须」，其余标「可选」，明确禁止的标 forbidden */

import type { MorphToken } from "@/lib/types";
import { H_ASPIRE } from "@/data/fr/h-aspire";

const VOWEL_START = /^[aàâäeéèêëiîïoôöuùûüyœæ]/i;
/** 词尾可能联诵的辅音 */
const SILENT_FINAL = new Set(["s", "x", "z", "t", "d", "n", "m", "p", "r", "g"]);
const LIAISON_PHONEME: Record<string, string> = {
  s: "z",
  x: "z",
  z: "z",
  t: "t",
  d: "t",
  n: "n",
  m: "m",
  p: "p",
  r: "ʁ",
  g: "k",
};

/** 必须联诵的限定词/代词/常见形态 */
const OBLIGATORY_WORDS = new Set([
  "les", "des", "un", "une", "deux", "trois", "six", "dix",
  "nous", "vous", "ils", "elles", "on", "en", "y",
  "est", "sont", "ont", "était", "étaient", "avait", "avaient",
  "suis", "es", "êtes", "sommes", "avez", "ont",
  "chez", "dans", "sans", "sous",
  "petit", "petite", "petits", "petites",
  "grand", "grande", "grands", "grandes",
  "bon", "bonne", "bons", "bonnes",
  "gros", "grosse", "gros", "grosses",
]);

const FORBIDDEN_RIGHT = new Set(["onze", "onzième", "un", "une", "uns", "unes"]);

function lastChar(word: string): string {
  return word.slice(-1).toLowerCase();
}

function startsWithMuteH(word: string): boolean {
  if (!/^h/i.test(word)) return false;
  const w = word.toLowerCase().replace(/[’'].*$/, "");
  // 名单收的是原形；复数 -s / -x 也要还原后再查
  return !H_ASPIRE.has(w) && !H_ASPIRE.has(w.replace(/[sx]$/, ""));
}

function startsWithH(word: string): boolean {
  return /^h/i.test(word);
}

/** 在 token 数组上就地标注联诵（写在左侧 token 上） */
export function applyLiaisons(tokens: MorphToken[]): void {
  for (let i = 0; i < tokens.length - 1; i++) {
    const left = tokens[i];
    const right = tokens[i + 1];
    if (left.pos === "PUNCT" || right.pos === "PUNCT") continue;
    if (left.elision) continue; // l'ami 等省音形式不联诵

    const leftEnd = lastChar(left.surface);
    if (!SILENT_FINAL.has(leftEnd)) continue;

    const rightWord = right.surface.toLowerCase();
    if (!VOWEL_START.test(rightWord) && !startsWithH(rightWord)) continue;
    if (startsWithH(rightWord) && !startsWithMuteH(rightWord)) {
      left.liaison = { type: "forbidden", phoneme: null };
      continue;
    }

    const phoneme = LIAISON_PHONEME[leftEnd] ?? null;
    if (!phoneme) continue;

    // 明确的禁止情形
    if (left.basicForm.toLowerCase() === "et") {
      left.liaison = { type: "forbidden", phoneme: null };
      continue;
    }
    if (left.pos === "NOUN" && left.number === "sg") {
      left.liaison = { type: "forbidden", phoneme: null };
      continue;
    }
    if (FORBIDDEN_RIGHT.has(rightWord)) {
      left.liaison = { type: "forbidden", phoneme: null };
      continue;
    }

    const obligatory =
      left.pos === "DET" ||
      left.pos === "PRON" ||
      (left.pos === "ADJ" && OBLIGATORY_WORDS.has(left.surface.toLowerCase())) ||
      (left.pos === "PREP" && OBLIGATORY_WORDS.has(left.surface.toLowerCase())) ||
      OBLIGATORY_WORDS.has(left.surface.toLowerCase());

    left.liaison = {
      type: obligatory ? "obligatory" : "optional",
      phoneme,
    };
  }
}
