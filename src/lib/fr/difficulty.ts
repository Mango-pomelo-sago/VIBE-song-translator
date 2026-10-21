/** 法语难度：内容词平均 CEFR 等级（A1=1 … C1=5） */

import { scoreTokens, type DifficultyScore } from "@/lib/difficulty";
import type { ProcessedLine } from "@/lib/types";

const CEFR_RANK: Record<string, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
};

const CEFR_LABELS = ["A1", "A2", "B1", "B2", "C1"];

const CONTENT_POS = new Set(["NOUN", "VERB", "ADJ", "ADV"]);

export function cefrRank(level: string | null | undefined): number | null {
  if (!level) return null;
  return CEFR_RANK[level] ?? null;
}

export function scoreFrenchLines(lines: ProcessedLine[]): DifficultyScore | null {
  return scoreTokens(lines, {
    scheme: "cefr",
    isContent: (pos) => CONTENT_POS.has(pos),
    rankOf: (t) => cefrRank(t.level),
    averageLabel: (avg) => {
      const idx = Math.min(
        CEFR_LABELS.length - 1,
        Math.max(0, Math.round(avg) - 1),
      );
      return CEFR_LABELS[idx];
    },
  });
}
