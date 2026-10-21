"use client";

import { useMemo } from "react";
import type { ProcessedLine } from "@/lib/types";
import { FR_GRAMMAR_COLORS } from "@/lib/lang/meta";
import { summarizeGrammar, type GrammarFocus } from "@/lib/fr/grammar";

const CHIPS: {
  key: GrammarFocus;
  label: string;
  color: string;
  title: string;
}[] = [
  { key: "verb", label: "动词", color: FR_GRAMMAR_COLORS.verb, title: "只看动词（含助动词）" },
  { key: "f", label: "阴性名词", color: FR_GRAMMAR_COLORS.f, title: "只看阴性名词" },
  { key: "m", label: "阳性名词", color: FR_GRAMMAR_COLORS.m, title: "只看阳性名词" },
  { key: "adj", label: "形容词", color: FR_GRAMMAR_COLORS.adj, title: "只看形容词（含性数配合）" },
  { key: "b1plus", label: "B1+", color: "#e11d48", title: "只看 B1 及以上词汇" },
];

/**
 * 法语歌曲的语法速览：名词阴阳性、动词时态、形容词与进阶词汇。
 * 点击标签会在歌词里高亮同类词，再点一次取消。
 */
export default function GrammarSummary({
  lines,
  focus,
  onChange,
}: {
  lines: ProcessedLine[];
  focus: GrammarFocus | null;
  onChange: (f: GrammarFocus | null) => void;
}) {
  const summary = useMemo(() => summarizeGrammar(lines), [lines]);
  const countOf = (key: GrammarFocus) =>
    key === "m"
      ? summary.masculine
      : key === "f"
        ? summary.feminine
        : key === "verb"
          ? summary.verbs
          : key === "adj"
            ? summary.adjectives
            : summary.b1plus;

  const visible = CHIPS.filter((c) => countOf(c.key) > 0);
  if (visible.length === 0) return null;

  return (
    <div className="mb-3 border-b border-glass-border pb-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-sc mr-0.5 text-[11px] font-bold tracking-wide text-ink/45">
          本曲语法
        </span>
        {visible.map((c) => {
          const active = focus === c.key;
          return (
            <button
              key={c.key}
              type="button"
              title={active ? "点击取消高亮" : c.title}
              aria-pressed={active}
              onClick={() => onChange(active ? null : c.key)}
              className="flex items-center gap-1 rounded-full border px-2 py-0.5 font-sc text-[11px] font-bold transition-colors"
              style={
                active
                  ? { backgroundColor: c.color, borderColor: c.color, color: "#fff" }
                  : {
                      backgroundColor: "rgba(255,255,255,0.45)",
                      borderColor: `${c.color}55`,
                      color: c.color,
                    }
              }
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: active ? "#fff" : c.color }}
              />
              {c.label}
              <span className={active ? "text-white/80" : "text-ink/45"}>
                {countOf(c.key)}
              </span>
            </button>
          );
        })}
        <span className="font-sc ml-auto hidden text-[10px] text-ink/35 sm:inline">
          点击标签高亮同类词
        </span>
      </div>

      {summary.tenses.length > 0 ? (
        <p className="font-sc mt-1.5 text-[10px] leading-relaxed text-ink/45">
          动词时态：
          {summary.tenses
            .slice(0, 4)
            .map((t) => `${t.label} ${t.count}`)
            .join(" · ")}
        </p>
      ) : null}

      {focus ? (
        <p className="font-sc mt-1 text-[10px] font-bold text-ink/50">
          已高亮「{CHIPS.find((c) => c.key === focus)?.label}」· 其余已淡出，再点一次取消
        </p>
      ) : null}
    </div>
  );
}
