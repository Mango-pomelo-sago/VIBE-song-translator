"use client";

import { LANG_CODES, LANG_META } from "@/lib/lang/meta";
import { useLang } from "./LangProvider";

/** 学习语言分段控件：日本語 / Français */
export default function LangSwitch() {
  const { lang, setLang } = useLang();

  return (
    <div
      className="flex shrink-0 overflow-hidden rounded-full border border-glass-border bg-glass-bg"
      role="tablist"
      aria-label="学习语言"
    >
      {LANG_CODES.map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setLang(code)}
            className={`px-2.5 py-1 font-sc text-xs font-bold transition-colors sm:px-3 ${
              active
                ? "bg-bauhaus-blue text-white-soft"
                : "text-ink/60 hover:bg-glass-hover"
            }`}
          >
            {LANG_META[code].tabLabel}
          </button>
        );
      })}
    </div>
  );
}
