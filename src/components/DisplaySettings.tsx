"use client";

import { FURIGANA_LABELS } from "@/lib/prefs";
import type { FuriganaMode } from "@/lib/prefs";
import { FR_GRAMMAR_COLORS, LANG_META, annotationModeFor } from "@/lib/lang/meta";
import { useLang } from "./LangProvider";
import { useDisplayPrefs } from "./DisplayPrefs";
import { AiSettingsButton } from "./AiSettings";
import SdfLensBlur from "./SdfLensBlur";

const JA_MODES: FuriganaMode[] = ["romaji", "kana", "hidden"];

/** 行内语法标签的颜色图例，与 TokenWord 的 rt 颜色一致 */
const GRAMMAR_LEGEND = [
  { label: "阳", title: "阳性名词（le / un）", color: FR_GRAMMAR_COLORS.m },
  { label: "阴", title: "阴性名词（la / une）", color: FR_GRAMMAR_COLORS.f },
  { label: "动", title: "动词：时态 + 人称（如 现·3单）", color: FR_GRAMMAR_COLORS.verb },
  { label: "形", title: "形容词：性数配合（如 形·阴复）", color: FR_GRAMMAR_COLORS.adj },
];

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`flex h-5 w-9 items-center rounded-full border border-glass-border p-0.5 transition-colors ${
          checked ? "bg-bauhaus-blue" : "bg-glass-bg"
        }`}
      >
        <span
          className={`block h-3.5 w-3.5 rounded-full bg-white-soft shadow-sm transition-transform ${
            checked ? "translate-x-3.5" : "translate-x-0"
          }`}
        />
      </button>
      <span className="font-sc text-xs font-bold text-ink/70">{label}</span>
    </label>
  );
}

/** 歌词显示偏好工具栏：日语注音三档；法语改为语法标注开关 + 文节/意群行 + 翻译列 */
export default function DisplaySettings() {
  const { prefs, set } = useDisplayPrefs();
  const { lang } = useLang();
  const meta = LANG_META[lang];
  const isFr = lang === "fr";
  const active = annotationModeFor(lang, prefs.furigana);

  return (
    <div className="glass-card relative">
      <SdfLensBlur />
      <div className="relative z-10 flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
        {isFr ? (
          <>
            <Toggle
              label="语法标注"
              checked={prefs.showGrammar}
              onChange={(v) => set({ showGrammar: v })}
            />
            {prefs.showGrammar ? (
              <div
                className="flex items-center gap-1.5"
                aria-label="语法标签颜色图例"
              >
                <span className="font-sc text-[10px] font-bold text-ink/40">图例</span>
                {GRAMMAR_LEGEND.map((g) => (
                  <span
                    key={g.label}
                    className="flex items-center gap-0.5"
                    title={g.title}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: g.color }}
                    />
                    <span
                      className="font-sc text-[10px] font-bold"
                      style={{ color: g.color }}
                    >
                      {g.label}
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sc text-xs font-bold text-ink/60">
              {meta.annotationLabel}
            </span>
            <div className="flex overflow-hidden rounded-lg border border-glass-border">
              {JA_MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => set({ furigana: m })}
                  className={`px-2.5 py-1 font-sc text-xs font-semibold transition-colors ${
                    active === m
                      ? "bg-bauhaus-blue text-white-soft"
                      : "bg-glass-bg text-ink/70 hover:bg-glass-hover"
                  }`}
                >
                  {FURIGANA_LABELS[m]}
                </button>
              ))}
            </div>
            {active === "hidden" ? (
              <span className="font-sc text-[10px] text-ink/50">
                点击歌词单词可临时显示注音（自测）
              </span>
            ) : null}
          </div>
        )}

      <Toggle
        label={meta.groupRowLabel}
        checked={prefs.showBunsetsu}
        onChange={(v) => set({ showBunsetsu: v })}
      />
      <Toggle
        label="翻译列"
        checked={prefs.showTranslation}
        onChange={(v) => set({ showTranslation: v })}
      />

      <div className="ml-auto">
        <AiSettingsButton />
      </div>
    </div>
    </div>
  );
}