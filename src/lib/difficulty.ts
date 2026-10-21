import { level, levelNumber } from "./jlpt";
import { isContentWord } from "./parts";
import type { ProcessedLine } from "./types";

/**
 * 歌曲难度评分：
 * 内容词按 JLPT 等级映射难度值（N5=1 … N1=5），取**已知词**的平均等级 → 0-100 分 + 档位。
 * 词表未收录的词不计入均值（避免本地 1210 词表覆盖不足把一切拉成「最难」），
 * 但暴露 unknownCount/unknownRatio 供 UI 提示覆盖情况。
 * 只在服务端 /api/song 主管线里计算一次。
 */

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

/** 难度口径：日语 JLPT / 法语 CEFR */
export type DifficultyScheme = "jlpt" | "cefr";

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  beginner: "入门",
  intermediate: "进阶",
  advanced: "挑战",
};

export type DifficultyScore = {
  /** 0-100（越高越难） */
  score: number;
  level: DifficultyLevel;
  /** 内容词总数 */
  vocabCount: number;
  /** 词表未收录数 */
  unknownCount: number;
  /** 难度口径；缺省视为 jlpt（兼容旧收藏数据） */
  scheme?: DifficultyScheme;
  /** 内容词最接近的平均等级，如 N4 / B1 */
  averageLevel?: string | null;
  /** 法语：B1 及以上内容词占比（0-1），用于解释难度 */
  rareRatio?: number | null;
};

export type ScoreTokensOptions = {
  scheme: DifficultyScheme;
  isContent: (pos: string) => boolean;
  /** token → 1..5；未知返回 null */
  rankOf: (token: import("./types").MorphToken) => number | null;
  /** 把平均 rank 还原成等级标签 */
  averageLabel?: (avg: number) => string | null;
};

/** 单个内容词的难度值：N5=1…N1=5；词表缺失返回 null（不计入均值） */
export function wordDifficulty(word: string): number | null {
  const lv = level(word);
  if (!lv) return null;
  return levelNumber(lv);
}

/** 通用难度核心：内容词等级均值 → 0-100 + 档位 */
export function scoreTokens(
  lines: ProcessedLine[],
  opts: ScoreTokensOptions,
): DifficultyScore | null {
  const known: number[] = [];
  let unknownCount = 0;

  for (const l of lines) {
    for (const t of l.tokens ?? []) {
      if (!opts.isContent(t.pos)) continue;
      const v = opts.rankOf(t);
      if (v === null) unknownCount++;
      else known.push(v);
    }
  }

  const vocabCount = known.length + unknownCount;
  if (vocabCount === 0) return null;

  // 全部词表未知 → 无法评估，给中性分并标记 unknownRatio=1
  let score: number;
  let averageLevel: string | null = null;
  if (known.length === 0) {
    score = 55;
  } else {
    const avg = known.reduce((a, b) => a + b, 0) / known.length;
    score = Math.round((avg / 5) * 100);
    averageLevel = opts.averageLabel?.(avg) ?? null;
  }

  const level: DifficultyLevel =
    score < 40 ? "beginner" : score < 70 ? "intermediate" : "advanced";

  return { score, level, vocabCount, unknownCount, scheme: opts.scheme, averageLevel };
}

/** 日语：内容词平均 JLPT 等级；无内容词返回 null（纯器乐等） */
export function scoreLines(lines: ProcessedLine[]): DifficultyScore | null {
  return scoreTokens(lines, {
    scheme: "jlpt",
    isContent: isContentWord,
    rankOf: (t) => wordDifficulty(t.basicForm ?? t.surface),
  });
}

/** 词表覆盖率 0-1（1=全收录），供 UI 提示难度可信度 */
export function unknownRatio(d: DifficultyScore | null): number {
  if (!d || d.vocabCount === 0) return 1;
  return d.unknownCount / d.vocabCount;
}
