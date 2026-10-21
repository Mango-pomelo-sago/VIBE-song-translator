/** 日语 profile：包装现有 kuromoji 管线，行为与改造前完全一致 */

import { tokenizeLine } from "@/lib/japanese";
import { segmentBunsetsu } from "@/lib/bunsetsu";
import { scoreLines } from "@/lib/difficulty";
import { lookupWithFallback } from "@/lib/dictionary";
import type { LanguageProfile } from "./types";

export const jaProfile: LanguageProfile = {
  code: "ja",
  locale: "ja-JP",

  async preflight() {
    await tokenizeLine("テスト");
  },

  async annotateLine(text) {
    const tokens = await tokenizeLine(text);
    const chunks = segmentBunsetsu(tokens);
    return {
      tokens,
      ruby: tokens.flatMap((t) => t.ruby),
      // 行罗马音由文节给出：跨 token 促音已在 segmentBunsetsu 内合并
      readingLine: chunks.map((b) => b.romaji).filter(Boolean).join(" ") || null,
      chunks,
      warnings: tokens.flatMap((t) => t.warnings ?? []),
    };
  },

  scoreDifficulty: scoreLines,

  dictionary: {
    lookup: (word, lemma) => lookupWithFallback(word, lemma),
  },
};
