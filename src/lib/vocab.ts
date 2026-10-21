"use client";

/**
 * 生词本（localStorage，仅本机）。
 * 按语言隔离：同形词（如日语「愛」与法语 «ami»）不会互相覆盖。
 */

import type { LangCode } from "./types";

const KEY = "vibe-vocab:v1";

export type VocabItem = {
  surface: string;
  basicForm: string;
  reading: string | null;
  romaji: string | null;
  /** JLPT / CEFR 等级或 null（未知） */
  level: string | null;
  /** 学习语言；旧数据缺省为日语 */
  lang?: LangCode;
  addedAt: number;
};

export function vocabKey(item: Pick<VocabItem, "basicForm" | "lang">): string {
  return `${item.lang ?? "ja"}:${item.basicForm}`;
}

export function loadVocab(): VocabItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // 旧数据没有 lang，一律视为日语（只读兼容，不破坏性重写）
    return (arr as VocabItem[]).map((i) => ({ ...i, lang: i.lang ?? "ja" }));
  } catch {
    return [];
  }
}

function persist(items: VocabItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // 存储满/隐私模式：静默失败
  }
}

export function hasVocab(basicForm: string, lang: LangCode = "ja"): boolean {
  return loadVocab().some((i) => vocabKey(i) === vocabKey({ basicForm, lang }));
}

/** 收藏/取消收藏，返回最新列表 */
export function toggleVocab(item: VocabItem): VocabItem[] {
  const items = loadVocab();
  const key = vocabKey(item);
  const idx = items.findIndex((i) => vocabKey(i) === key);
  if (idx >= 0) items.splice(idx, 1);
  else items.unshift({ ...item, lang: item.lang ?? "ja" });
  persist(items);
  return items;
}

export function clearVocab() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
