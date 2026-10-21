/** 语言元数据：客户端安全，不引入任何 Node / 分词依赖 */

import type { LangCode } from "@/lib/types";
import { isContentWord } from "@/lib/parts";
import { JLPT_COLORS } from "@/lib/jlpt";

export const LANG_CODES = ["ja", "fr"] as const;

export type LangMeta = {
  /** 切换控件上的文字 */
  tabLabel: string;
  /** 中文语言名，用于「生词本 · 日语」等 */
  uiName: string;
  locale: string;
  searchPlaceholder: string;
  idleHeading: string;
  idleSubline: string;
  /** 注音/发音档位的叫法 */
  annotationLabel: string;
  /** 跨词语义行的叫法（文节 / 意群） */
  groupRowLabel: string;
};

export const LANG_META: Record<LangCode, LangMeta> = {
  ja: {
    tabLabel: "日本語",
    uiName: "日语",
    locale: "ja-JP",
    searchPlaceholder: "输入日文歌名…",
    idleHeading: "输入日文歌名，跟着音乐学日语",
    idleSubline: "罗马音标注 · 文节断句 · 悬停查词 · 中文翻译对照",
    annotationLabel: "注音",
    groupRowLabel: "文节行",
  },
  fr: {
    tabLabel: "Français",
    uiName: "法语",
    locale: "fr-FR",
    searchPlaceholder: "输入法语歌名…",
    idleHeading: "输入法语歌名，跟着音乐学法语",
    idleSubline: "阴阳性与变位 · 意群分组 · 悬停查词 · 中文翻译对照",
    annotationLabel: "语法",
    groupRowLabel: "意群分组",
  },
};

export function isLangCode(v: unknown): v is LangCode {
  return v === "ja" || v === "fr";
}

/** 归一化请求里的语言，缺省日语 */
export function normalizeLang(v: unknown): LangCode {
  return isLangCode(v) ? v : "ja";
}

/** 法语内容词（与 Lexique 的 cgram 映射后的词性对齐） */
const FR_CONTENT_POS = new Set(["NOUN", "VERB", "ADJ", "ADV"]);

export function isContentPos(lang: LangCode, pos: string): boolean {
  return lang === "fr" ? FR_CONTENT_POS.has(pos) : isContentWord(pos);
}

/** 注音档位在法语下的映射：没有假名档，历史值 kana 视为 romaji（即 IPA） */
export function annotationModeFor(
  lang: LangCode,
  mode: "romaji" | "kana" | "hidden",
): "romaji" | "kana" | "hidden" {
  if (lang === "fr" && mode === "kana") return "romaji";
  return mode;
}

/** CEFR 等级配色：A1 绿 → C1 红，与 JLPT 的视觉语言保持一致 */
export const CEFR_COLORS: Record<string, string> = {
  A1: "#6CBE6A",
  A2: "#14b8a6",
  B1: "#f59e0b",
  B2: "#fb923c",
  C1: "#fb7185",
};

/** 等级颜色：日语 JLPT / 法语 CEFR */
export function levelColor(
  lang: LangCode,
  lv: string | null | undefined,
): string | null {
  if (!lv) return null;
  if (lang === "fr") return CEFR_COLORS[lv] ?? null;
  return (JLPT_COLORS as Record<string, string>)[lv] ?? null;
}

/** 等级徽章文案：JLPT N4 / CEFR B1 */
export function levelBadgeLabel(
  lang: LangCode,
  lv: string | null | undefined,
): string {
  if (!lv) return lang === "fr" ? "CEFR 未知" : "JLPT 未知";
  return lang === "fr" ? `CEFR ${lv}` : `JLPT ${lv}`;
}
