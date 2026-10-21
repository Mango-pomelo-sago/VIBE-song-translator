"use client";

import { FURIGANA_LABELS } from "@/lib/prefs";
import type { FuriganaMode } from "@/lib/prefs";
import { LANG_META, annotationModeFor } from "@/lib/lang/meta";
import { useLang } from "./LangProvider";
import { useDisplayPrefs } from "./DisplayPrefs";
import { AiSettingsButton } from "./AiSettings";
import SdfLensBlur from "./SdfLensBlur";

const JA_MODES: FuriganaMode[] = ["romaji", "kana", "hidden"];
const FR_MODES: FuriganaMode[] = ["romaji", "hidden"];

/** 法语没有假名档；罗马音档实际显示 IPA */
const FR_LABELS: Partial<Record<FuriganaMode, string>> = {
  romaji: "IPA",
  hidden: FURIGANA_LABELS.hidden,
};

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

/** 歌词显示偏好工具栏：注音三档 + 文节行/翻译列开关 */
export default function DisplaySettings() {
  const { prefs, set } = useDisplayPrefs();
  const { lang } = useLang();
  const meta = LANG_META[lang];
  const isFr = lang === "fr";
  const modes = isFr ? FR_MODES : JA_MODES;
  const active = annotationModeFor(lang, prefs.furigana);

  return (
    <div className="glass-card relative">
      <SdfLensBlur />
      <div className="relative z-10 flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-sc text-xs font-bold text-ink/60">
          {meta.annotationLabel}
        </span>
        <div className="flex overflow-hidden rounded-lg border border-glass-border">
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => set({ furigana: m })}
              className={`px-2.5 py-1 font-sc text-xs font-semibold transition-colors ${
                active === m
                  ? "bg-bauhaus-blue text-white-soft"
                  : "bg-glass-bg text-ink/70 hover:bg-glass-hover"
              }`}
            >
              {isFr ? FR_LABELS[m] ?? FURIGANA_LABELS[m] : FURIGANA_LABELS[m]}
            </button>
          ))}
        </div>
        {active === "hidden" ? (
          <span className="font-sc text-[10px] text-ink/50">
            点击歌词单词可临时显示{isFr ? "音标" : "注音"}（自测）
          </span>
        ) : null}
      </div>

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