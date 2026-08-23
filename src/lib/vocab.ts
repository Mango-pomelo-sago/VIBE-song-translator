"use client";

/**
 * 生词本（localStorage，仅本机）。
 * M5 先提供最小收藏；M7 在其上加 VocabStore Context + 抽屉。
 */

const KEY = "vibe-vocab:v1";

export type VocabItem = {
  surface: string;
  basicForm: string;
  reading: string | null;
  romaji: string | null;
  /** JLPT 等级或 null（未知） */
  level: string | null;
  addedAt: number;
};

export function loadVocab(): VocabItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as VocabItem[]) : [];
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

export function hasVocab(basicForm: string): boolean {
  return loadVocab().some((i) => i.basicForm === basicForm);
}

/** 收藏/取消收藏，返回最新列表 */
export function toggleVocab(item: VocabItem): VocabItem[] {
  const items = loadVocab();
  const idx = items.findIndex((i) => i.basicForm === item.basicForm);
  if (idx >= 0) items.splice(idx, 1);
  else items.unshift(item);
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
