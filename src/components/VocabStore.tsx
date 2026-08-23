"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { clearVocab, loadVocab, toggleVocab } from "@/lib/vocab";
import type { VocabItem } from "@/lib/vocab";

type VocabCtx = {
  items: VocabItem[];
  has: (basicForm: string) => boolean;
  toggle: (item: VocabItem) => boolean; // 返回是否已收藏
  clear: () => void;
};

const Ctx = createContext<VocabCtx | null>(null);

/** 生词本 Provider：localStorage 单例，跨歌曲汇总 */
export function VocabProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<VocabItem[]>([]);

  useEffect(() => {
    setItems(loadVocab());
  }, []);

  const toggle = useCallback((item: VocabItem): boolean => {
    const next = toggleVocab(item);
    setItems(next);
    return next.some((i) => i.basicForm === item.basicForm);
  }, []);

  const clear = useCallback(() => {
    clearVocab();
    setItems([]);
  }, []);

  const value = useMemo<VocabCtx>(
    () => ({
      items,
      has: (bf) => items.some((i) => i.basicForm === bf),
      toggle,
      clear,
    }),
    [items, toggle, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVocab(): VocabCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVocab 必须在 VocabProvider 内使用");
  return ctx;
}
