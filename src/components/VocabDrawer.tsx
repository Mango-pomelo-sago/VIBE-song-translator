"use client";

import { useMemo, useState } from "react";
import { BookOpen, Star, X } from "lucide-react";
import { LANG_META, levelBadgeLabel, levelColor } from "@/lib/lang/meta";
import type { LangCode } from "@/lib/types";
import { vocabKey } from "@/lib/vocab";
import { useVocab } from "./VocabStore";

type SortMode = "date" | "level";

/** 等级排序权重：JLPT N5→N1 与 CEFR A1→C1 都是 1→5 */
const LEVEL_RANK: Record<string, number> = {
  N5: 1, N4: 2, N3: 3, N2: 4, N1: 5,
  A1: 1, A2: 2, B1: 3, B2: 4, C1: 5,
};

function rankOf(lv: string | null): number {
  return lv ? LEVEL_RANK[lv] ?? 99 : 99;
}

/** 生词本抽屉：跨歌曲汇总收藏的生词，可从歌词 tooltip 进入，也可从工具栏打开 */
export default function VocabDrawer() {
  const { items, toggle, clear } = useVocab();
  const [open, setOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const count = items.length;

  // 按语言分组；旧数据（无 lang）归入日语
  const groups = useMemo(() => {
    const byLang = new Map<LangCode, typeof items>();
    for (const it of items) {
      const l = it.lang ?? "ja";
      const arr = byLang.get(l) ?? [];
      arr.push(it);
      byLang.set(l, arr);
    }
    return (["ja", "fr"] as LangCode[])
      .filter((l) => byLang.has(l))
      .map((l) => {
        const arr = [...(byLang.get(l) ?? [])];
        if (sortMode === "date") {
          arr.sort((a, b) => b.addedAt - a.addedAt);
        } else {
          arr.sort((a, b) => rankOf(a.level) - rankOf(b.level));
        }
        return { lang: l, items: arr };
      });
  }, [items, sortMode]);

  const multiLang = groups.length > 1;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="glass-card flex items-center gap-2 px-4 py-2 font-sc text-sm font-bold text-ink"
        aria-label="打开生词本"
      >
        <span aria-hidden>
          <BookOpen size={16} className="text-bauhaus-blue" />
        </span>
        生词本
        {count > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-bauhaus-blue px-1.5 text-[10px] font-bold text-white-soft">
            {count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="glass-modal-overlay">
          <div
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside
            className="glass-modal absolute right-0 top-0 flex h-full w-80 max-w-[88vw] flex-col"
            role="dialog"
            aria-label="生词本"
          >
            <div className="flex items-center justify-between border-b border-glass-border p-4">
              <div>
                <h3 className="font-sc text-lg font-bold text-ink">生词本</h3>
                <p className="font-sc text-xs text-ink/55">
                  {count ? `共 ${count} 个生词（仅本机保存）` : "还没有收藏生词"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {count > 0 ? (
                  <div className="flex overflow-hidden rounded-md border border-glass-border text-xs font-bold">
                    <button
                      onClick={() => setSortMode("date")}
                      className={
                        "px-2 py-1 transition-colors " +
                        (sortMode === "date"
                          ? "bg-bauhaus-blue text-white-soft"
                          : "bg-glass-bg text-ink/60 hover:bg-glass-hover")
                      }
                    >
                      日期
                    </button>
                    <button
                      onClick={() => setSortMode("level")}
                      className={
                        "px-2 py-1 transition-colors " +
                        (sortMode === "level"
                          ? "bg-bauhaus-blue text-white-soft"
                          : "bg-glass-bg text-ink/60 hover:bg-glass-hover")
                      }
                    >
                      难度
                    </button>
                  </div>
                ) : null}
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-glass-hover hover:text-ink"
                  aria-label="关闭"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {groups.length === 0 ? (
                <p className="flex items-center justify-center gap-1 p-4 text-center text-sm text-ink/45">
                  在歌词里 hover 单词，点击
                  <Star size={14} className="fill-bauhaus-blue text-bauhaus-blue" />
                  收藏后
                  <br />
                  会汇总到这里。
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {groups.map((g) => (
                    <section key={g.lang}>
                      {multiLang ? (
                        <h4 className="font-sc mb-1.5 text-xs font-bold text-ink/50">
                          {LANG_META[g.lang].uiName}
                        </h4>
                      ) : null}
                      <ul className="flex flex-col gap-2">
                        {g.items.map((it) => {
                          const lv = it.level ?? null;
                          const lvColor = levelColor(g.lang, lv);
                          return (
                            <li
                              key={`${vocabKey(it)}:${it.addedAt}`}
                              className="flex items-start justify-between gap-2 rounded-lg border border-glass-border bg-glass-bg px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p
                                  className={`truncate text-base font-bold leading-tight text-ink ${
                                    g.lang === "fr" ? "font-lyric-fr" : "font-lyric"
                                  }`}
                                >
                                  {it.surface}
                                </p>
                                <p
                                  className={`truncate text-xs text-ink/55 ${
                                    g.lang === "fr" ? "font-ipa" : "font-romaji"
                                  }`}
                                >
                                  {it.reading ?? ""}
                                  {it.romaji ? ` / ${it.romaji}` : ""}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-1.5">
                                <span
                                  className="rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase"
                                  style={
                                    lvColor
                                      ? { color: lvColor, borderColor: lvColor }
                                      : { color: "#8a6da6", borderColor: "#8a6da6" }
                                  }
                                >
                                  {levelBadgeLabel(g.lang, lv)}
                                </span>
                                <button
                                  onClick={() => toggle(it)}
                                  className="flex h-6 w-6 items-center justify-center rounded-md border border-glass-border text-ink/50 transition-colors hover:bg-glass-hover"
                                  title="移出生词本"
                                  aria-label={`移出 ${it.surface}`}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 ? (
              <div className="border-t border-glass-border p-3">
                <button
                  onClick={() => {
                    clear();
                    setOpen(false);
                  }}
                  className="w-full rounded-lg border border-glass-border bg-glass-bg py-1.5 font-sc text-xs font-bold text-ink/60 transition-colors hover:bg-glass-hover"
                >
                  清空生词本
                </button>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}