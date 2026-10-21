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
import type { LangCode } from "@/lib/types";
import { isLangCode, normalizeLang } from "@/lib/lang/meta";

const KEY = "vibe-lang:v1";

type LangCtx = {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
};

const Ctx = createContext<LangCtx | null>(null);

function loadLang(): LangCode {
  if (typeof window === "undefined") return "ja";
  try {
    return normalizeLang(window.localStorage.getItem(KEY));
  } catch {
    return "ja";
  }
}

/** 学习语言 Provider：localStorage 持久化，默认日语 */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("ja");

  useEffect(() => {
    setLangState(loadLang());
  }, []);

  const setLang = useCallback((next: LangCode) => {
    setLangState(next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* 隐私模式等场景静默失败 */
    }
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang 必须在 LangProvider 内使用");
  return ctx;
}

export { isLangCode };
