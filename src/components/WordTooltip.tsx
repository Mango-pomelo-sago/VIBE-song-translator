"use client";

import { useEffect, useState } from "react";
import { Star, ArrowRight } from "lucide-react";
import type { DictEntry, MorphToken } from "@/lib/types";
import { fetchEntry } from "./DictionaryCache";
import { colorFor, level, normalizeJishoJlpt } from "@/lib/jlpt";
import type { VocabItem } from "@/lib/vocab";
import { useVocab } from "./VocabStore";

/** hover 词卡：读音 + JLPT 徽章 + 词性 + 前 3 条英文释义 + 收藏 + Jisho 链接 */
export default function WordTooltip({ token }: { token: MorphToken }) {
  const [entry, setEntry] = useState<DictEntry | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "miss">("loading");
  const { has, toggle } = useVocab();
  const saved = has(token.basicForm);

  useEffect(() => {
    let alive = true;
    setState("loading");
    fetchEntry(token.surface, token.basicForm).then((e) => {
      if (!alive) return;
      setEntry(e);
      setState(e ? "ok" : "miss");
    });
    return () => {
      alive = false;
    };
  }, [token.surface, token.basicForm]);

  const jishoLv = normalizeJishoJlpt(entry?.jlpt?.[0]);
  const localLv = level(token.basicForm) ?? level(token.surface);
  const lv = jishoLv ?? localLv;
  const lvColor = colorFor(lv);
  const displayWord = entry?.word ?? token.surface;
  const reading = entry?.reading ?? token.reading;

  function handleSave() {
    const item: VocabItem = {
      surface: token.surface,
      basicForm: token.basicForm,
      reading: token.reading,
      romaji: token.romaji,
      level: lv,
      addedAt: Date.now(),
    };
    toggle(item);
  }

  return (
    <div
      className="glass-card absolute left-0 top-full z-40 mt-1 min-w-48 max-w-lg p-3 shadow-lg"
      style={{ backgroundColor: "rgba(255,255,255,0.97)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-lyric text-base font-bold leading-tight text-ink">
            {displayWord}
          </div>
          <p className="font-romaji mt-0.5 text-xs text-ink/60">
            {reading ? reading : ""}
            {token.romaji ? ` / ${token.romaji}` : ""}
          </p>
        </div>
        <button
          onClick={handleSave}
          title={saved ? "已收藏，点击取消" : "收藏到生词本"}
          className="shrink-0 leading-none"
          aria-label="收藏到生词本"
        >
          <Star
            size={20}
            className={saved ? "fill-bauhaus-blue text-bauhaus-blue" : "text-ink/30"}
          />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className="rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={lvColor ? { color: lvColor, borderColor: lvColor } : { color: "#8a6da6", borderColor: "#8a6da6" }}
        >
          {lv ? `JLPT ${lv}` : "JLPT 未知"}
        </span>
        {token.pos && token.pos !== "未知" ? (
          <span className="rounded-sm border border-glass-border px-1.5 py-0.5 text-[10px] font-bold text-ink/50">
            {token.pos}
          </span>
        ) : null}
      </div>

      <div className="mt-2">
        {state === "loading" ? (
          <p className="animate-pulse text-xs text-ink/50">查询中…</p>
        ) : state === "miss" || !entry ? (
          <p className="text-xs text-ink/50">暂无释义（Jisho 未收录）</p>
        ) : (
          <ul className="space-y-1.5">
            {entry.senses.slice(0, 3).map((s, i) => (
              <li key={i} className="text-xs leading-snug text-ink/85">
                {s.partsOfSpeech.length ? (
                  <span className="font-bold text-ink/50">{s.partsOfSpeech[0]} · </span>
                ) : null}
                {s.english.slice(0, 3).join("；")}
              </li>
            ))}
          </ul>
        )}
      </div>

      <a
        href={entry?.url ?? `https://jisho.org/search/${encodeURIComponent(token.surface)}`}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-0.5 text-xs font-semibold text-ink/60 underline decoration-bauhaus-blue/50 underline-offset-2 hover:text-bauhaus-blue"
      >
        在 Jisho 查看
        <ArrowRight size={12} />
      </a>
    </div>
  );
}