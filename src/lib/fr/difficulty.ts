/**
 * 法语难度：不看发音，看语法与词汇分布。
 * 由两部分组成：
 *  1) 内容词平均 CEFR 等级（A1=1 … C1=5）
 *  2) B1 及以上内容词占比（rareRatio）——歌词里少见词越多，实际越难
 * 只看平均值时所有法语歌都会挤在 A1/A2，无法区分为入门/进阶/挑战。
 */

import type { DifficultyLevel, DifficultyScore } from "@/lib/difficulty";
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

/** 平均等级占的权重（满分 62）+ B1+ 占比权重（满分 100）+ 基础分 */
const BASE_SCORE = 8;
const AVERAGE_WEIGHT = 62;
const RARE_WEIGHT = 100;

export function cefrRank(level: string | null | undefined): number | null {
  if (!level) return null;
  return CEFR_RANK[level] ?? null;
}

export function scoreFrenchLines(lines: ProcessedLine[]): DifficultyScore | null {
  let known = 0;
  let unknown = 0;
  let rankSum = 0;
  let rare = 0;

  for (const l of lines) {
    for (const t of l.tokens ?? []) {
      if (!(t.content ?? CONTENT_POS.has(t.pos))) continue;
      const r = cefrRank(t.level);
      if (r === null) {
        unknown++;
        continue;
      }
      known++;
      rankSum += r;
      if (r >= 3) rare++; // B1 / B2 / C1
    }
  }

  const vocabCount = known + unknown;
  if (vocabCount === 0) return null;

  // 全部词表未知 → 无法评估，给中性分并标记 unknownRatio=1
  if (known === 0) {
    return {
      score: 55,
      level: "intermediate",
      vocabCount,
      unknownCount: unknown,
      scheme: "cefr",
      averageLevel: null,
      rareRatio: null,
    };
  }

  const avg = rankSum / known;
  const rareRatio = rare / known;
  const score = Math.min(
    100,
    Math.max(
      0,
      Math.round(BASE_SCORE + ((avg - 1) / 4) * AVERAGE_WEIGHT + rareRatio * RARE_WEIGHT),
    ),
  );
  const idx = Math.min(CEFR_LABELS.length - 1, Math.max(0, Math.round(avg) - 1));
  const level: DifficultyLevel =
    score < 30 ? "beginner" : score < 45 ? "intermediate" : "advanced";

  return {
    score,
    level,
    vocabCount,
    unknownCount: unknown,
    scheme: "cefr",
    averageLevel: CEFR_LABELS[idx],
    rareRatio: Number(rareRatio.toFixed(3)),
  };
}
