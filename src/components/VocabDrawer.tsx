"use client";

import { useMemo, useState } from "react";
import { BookOpen, Star, X } from "lucide-react";
import { colorFor, labelFor, levelNumber } from "@/lib/jlpt";
import type { JlptLevel } from "@/lib/jlpt";
import { useVocab } from "./VocabStore";

type SortMode = "date" | "level";

/** 生词本抽屉：跨歌曲汇总收藏的生词，可从歌词 tooltip 进入，也可从工具栏打开 */
export default function VocabDrawer() {
  const { items, toggle, clear } = useVocab();
  const [open, setOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const count = items.length;

  const sorted = useMemo(() => {
    const copy = [...items];
    if (sortMode === "date") {
      copy.sort((a, b) => b.addedAt - a.addedAt);
    } else {
      copy.sort((a, b) => {
        const ao = levelNumber(a.level as JlptLevel | null);
        const bo = levelNumber(b.level as JlptLevel | null);
        return ao - bo;
      });
    }
    return copy;
  }, [items, sortMode]);

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
              {sorted.length === 0 ? (
                <p className="flex items-center justify-center gap-1 p-4 text-center text-sm text-ink/45">
                  在歌词里 hover 单词，点击
                  <Star size={14} className="fill-bauhaus-blue text-bauhaus-blue" />
                  收藏后
                  <br />
                  会汇总到这里。
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {sorted.map((it) => {
                    const lv = (it.level ?? null) as JlptLevel | null;
                    const lvColor = colorFor(lv);
                    return (
                      <li
                        key={`${it.basicForm}:${it.addedAt}`}
                        className="flex items-start justify-between gap-2 rounded-lg border border-glass-border bg-glass-bg px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="font-lyric truncate text-base font-bold leading-tight text-ink">
                            {it.surface}
                          </p>
                          <p className="font-romaji truncate text-xs text-ink/55">
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
                            {lv ? `JLPT ${labelFor(lv)}` : "未知"}
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