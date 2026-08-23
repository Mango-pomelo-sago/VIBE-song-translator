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
import {
  DEFAULT_PREFS,
  loadPrefs,
  savePrefs,
  type DisplayPrefs,
} from "@/lib/prefs";

type DisplayPrefsCtx = {
  prefs: DisplayPrefs;
  set: (patch: Partial<DisplayPrefs>) => void;
};

const Ctx = createContext<DisplayPrefsCtx | null>(null);

/** 显示偏好 Provider（注音三档 + 文节行/翻译列开关），localStorage 持久化 */
export function DisplayPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<DisplayPrefs>({ ...DEFAULT_PREFS });

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  const set = useCallback((patch: Partial<DisplayPrefs>) => {
    setPrefs((p) => ({ ...p, ...patch }));
  }, []);

  const value = useMemo(() => ({ prefs, set }), [prefs, set]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDisplayPrefs(): DisplayPrefsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDisplayPrefs 必须在 DisplayPrefsProvider 内使用");
  return ctx;
}

export { DEFAULT_PREFS };
