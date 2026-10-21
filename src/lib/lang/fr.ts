/** 法语 profile：本地分词/音标/联诵/意群，AI 只做后续增强 */

import { tokenizeFrench } from "@/lib/fr/tokenize";
import { applyLiaisons } from "@/lib/fr/liaison";
import { segmentChunks } from "@/lib/fr/chunks";
import { scoreFrenchLines } from "@/lib/fr/difficulty";
import { lookupFrenchWord } from "@/lib/fr/dictionary";
import type { LanguageProfile } from "./types";

export const frProfile: LanguageProfile = {
  code: "fr",
  locale: "fr-FR",

  async annotateLine(text) {
    const tokens = tokenizeFrench(text);
    applyLiaisons(tokens);
    const chunks = segmentChunks(tokens);
    return {
      tokens,
      ruby: tokens.flatMap((t) => t.ruby),
      readingLine: chunks.map((c) => c.romaji).filter(Boolean).join(" ") || null,
      chunks,
      warnings: [],
    };
  },

  scoreDifficulty: scoreFrenchLines,

  dictionary: {
    lookup: (word, lemma) => lookupFrenchWord(word, lemma),
  },
};
