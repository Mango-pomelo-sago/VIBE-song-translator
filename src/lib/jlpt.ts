import { JLPT_WORDS } from "@/data/jlpt";

/** 词汇等级：N5（最易）→ N1（最难） */
export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

const LEVEL_ORDER: Record<JlptLevel, number> = { N5: 1, N4: 2, N3: 3, N2: 4, N1: 5 };

/** 本地词表查找；词表缺失返回 null（前端显示「未知」，hover 时用 Jisho jlpt 交叉校验） */
export function level(word: string): JlptLevel | null {
  const lv = JLPT_WORDS[word];
  return lv === "N5" || lv === "N4" || lv === "N3" || lv === "N2" || lv === "N1"
    ? lv
    : null;
}

export function levelNumber(lv: JlptLevel | null): number {
  return lv ? LEVEL_ORDER[lv] : 0;
}

/** 难度配色：N5 绿 → N1 红（红=难）；未知用中性色（前端再乘透明度） */
export const JLPT_COLORS: Record<JlptLevel, string> = {
  N5: "#6CBE6A",
  N4: "#14b8a6",
  N3: "#f59e0b",
  N2: "#fb923c",
  N1: "#fb7185",
};

export function colorFor(levelOrNull: JlptLevel | null): string | null {
  return levelOrNull ? JLPT_COLORS[levelOrNull] : null;
}

/** Jisho 的 jlpt tag（"jlpt-n5"）→ 本地等级（"N5"）；非法返回 null */
export function normalizeJishoJlpt(tag: string | undefined): JlptLevel | null {
  if (!tag) return null;
  const m = /^jlpt-(n[1-5])$/i.exec(tag);
  const lv = m ? m[1].toUpperCase() : tag.toUpperCase();
  return lv === "N5" || lv === "N4" || lv === "N3" || lv === "N2" || lv === "N1"
    ? lv
    : null;
}

/** 等级徽章文案（tooltip / 生词本用） */
export function labelFor(levelOrNull: JlptLevel | null): string {
  return levelOrNull ?? "未知";
}
