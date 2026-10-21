"use client";

import { useMemo, useState } from "react";
import { Target, ChevronDown, ChevronRight } from "lucide-react";
import { SEED_SONGS } from "@/data/songs";
import type { DifficultyLevel } from "@/lib/difficulty";
import type { NeteaseSong } from "@/lib/types";
import DifficultyBadge, { DIFFICULTY_COLORS } from "./DifficultyBadge";
import SdfLensBlur from "./SdfLensBlur";

type Props = {
  onSelect: (song: NeteaseSong) => void;
  disabled?: boolean;
};

const GROUPS: {
  level: DifficultyLevel;
  /** 几何 icon 类型：圆 / 方块 / 菱形 */
  shape: "circle" | "square" | "diamond";
  hint: string;
}[] = [
  { level: "beginner", shape: "circle", hint: "常用词多，适合入门" },
  { level: "intermediate", shape: "square", hint: "词汇更丰富，稳步进阶" },
  { level: "advanced", shape: "diamond", hint: "难点词多，挑战一下" },
];

/** 按难度档位返回几何图标（构成主义/包豪斯风格，替代 emoji） */
function ShapeIcon({ shape, color }: { shape: "circle" | "square" | "diamond"; color: string }) {
  const base = "inline-block";
  if (shape === "circle") {
    return <span className={`${base} h-3 w-3 rounded-full`} style={{ backgroundColor: color }} />;
  }
  if (shape === "square") {
    return <span className={`${base} h-3 w-3`} style={{ backgroundColor: color }} />;
  }
  return <span className={`${base} h-3 w-3 rotate-45`} style={{ backgroundColor: color }} />;
}

/**
 * 歌曲难度推荐：内置热门 J-pop 种子曲目，按难度分档（入门/进阶/挑战）展示。
 * 点击任一行即加载该曲（复用搜索流程的 handleSelect）。
 */
export default function RecommendationPanel({ onSelect, disabled }: Props) {
  // 折叠态：默认只展开入门档，避免首页信息过载
  const [openLevels, setOpenLevels] = useState<Record<string, boolean>>({
    beginner: true,
  });

  const grouped = useMemo(() => {
    const sorted = [...SEED_SONGS].sort((a, b) => a.difficulty.score - b.difficulty.score);
    const g: Record<string, typeof sorted> = {};
    for (const s of sorted) {
      (g[s.difficulty.level] ??= []).push(s);
    }
    return g;
  }, []);

  return (
    <section className="glass-card relative" aria-label="歌曲难度推荐">
      <SdfLensBlur />
      <div className="relative z-10">
        <header className="flex items-center justify-between border-b border-glass-border px-4 py-3">
          <h2 className="font-sc flex items-center gap-2 text-base font-bold text-ink">
            <Target size={18} className="text-bauhaus-blue" />
            按难度挑歌
          </h2>
          <span className="hidden shrink-0 font-romaji text-xs text-ink/50 sm:inline">难度由歌词内容词平均 JLPT 等级估算</span>
        </header>

        <div className="flex flex-col gap-0">
          {GROUPS.map(({ level, shape, hint }) => {
            const songs = grouped[level] ?? [];
            const open = !!openLevels[level];
            const accent = DIFFICULTY_COLORS[level];

            return (
              <div key={level}>
                <button
                  type="button"
                  onClick={() => setOpenLevels((o) => ({ ...o, [level]: !o[level] }))}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-glass-hover"
                  aria-expanded={open}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-glass-border">
                    <ShapeIcon shape={shape} color={accent} />
                  </span>
                  <span className="font-sc flex-1">
                    <span className="text-sm font-bold" style={{ color: accent }}>
                      {level === "beginner" ? "入门" : level === "intermediate" ? "进阶" : "挑战"}
                    </span>
                    <span className="ml-2 text-xs text-ink/60">{hint}</span>
                  </span>
                  <span className="font-romaji flex items-center gap-1 text-xs text-ink/50">
                    {songs.length} 首 {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                </button>

                {open ? (
                  <div className="border-t border-glass-border">
                    {songs.length === 0 ? (
                      <p className="font-sc px-4 py-3 text-sm text-ink/50">暂无收录此档曲目</p>
                    ) : (
                      songs.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => onSelect(s)}
                          disabled={disabled}
                          className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-glass-hover disabled:cursor-wait disabled:opacity-70"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="font-sc block truncate text-sm font-bold text-ink">
                              {s.name}
                            </span>
                            <span className="font-sc block truncate text-xs text-ink/60">
                              {s.artists.map((a) => a.name).join(" · ")}
                            </span>
                          </span>
                          <span className="font-romaji text-[11px] text-ink/50">
                            {Math.round(s.difficulty.score / 10)}/10
                          </span>
                          <DifficultyBadge difficulty={s.difficulty} compact />
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}