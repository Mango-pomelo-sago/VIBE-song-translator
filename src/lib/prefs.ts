"use client";

/** 显示偏好：注音三档 + 文节行/翻译列开关（localStorage 持久化） */

export type FuriganaMode = "romaji" | "kana" | "hidden";

export type DisplayPrefs = {
  /** 汉字上方注音：罗马音 / 假名 / 隐藏（自测） */
  furigana: FuriganaMode;
  /** 每行下方文节罗马音 */
  showBunsetsu: boolean;
  /** 右侧中文翻译列 */
  showTranslation: boolean;
};

export const DEFAULT_PREFS: DisplayPrefs = {
  furigana: "romaji",
  showBunsetsu: true,
  showTranslation: true,
};

export const FURIGANA_LABELS: Record<FuriganaMode, string> = {
  romaji: "罗马音",
  kana: "假名",
  hidden: "隐藏",
};

const KEY = "vibe-prefs:v1";

export function loadPrefs(): DisplayPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<DisplayPrefs>;
    return {
      furigana: parsed.furigana ?? DEFAULT_PREFS.furigana,
      showBunsetsu: parsed.showBunsetsu ?? DEFAULT_PREFS.showBunsetsu,
      showTranslation: parsed.showTranslation ?? DEFAULT_PREFS.showTranslation,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: DisplayPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* 隐私模式等场景静默失败 */
  }
}
