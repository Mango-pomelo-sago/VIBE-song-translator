"use client";

import { Music, Star, X } from "lucide-react";
import { usePlaylist } from "./PlaylistStore";
import type { NeteaseSong } from "@/lib/types";
import DifficultyBadge from "./DifficultyBadge";
import SdfLensBlur from "./SdfLensBlur";

type Props = {
  onSelect: (song: NeteaseSong) => void;
  disabled?: boolean;
};

/**
 * 「我的歌单」：展示已收藏歌曲，点击即加载歌词。
 * 右键/长按可移除该曲。
 */
export default function PlaylistPanel({ onSelect, disabled }: Props) {
  const { items, toggle } = usePlaylist();

  return (
    <section className="glass-card relative" aria-label="我的歌单">
      <SdfLensBlur />
      <div className="relative z-10">
        <header className="flex items-center justify-between border-b border-glass-border px-4 py-3">
          <h2 className="font-sc flex items-center gap-2 text-base font-bold text-ink">
            <Music size={18} className="text-bauhaus-blue" />
            我的歌单
          </h2>
          <span className="font-romaji text-xs text-ink/50">{items.length} 首</span>
        </header>

        <div className="max-h-72 overflow-y-auto">
          {items.length === 0 ? (
            <p className="font-sc px-4 py-6 text-center text-sm text-ink/50">
              还没有收藏歌曲。
              <br />
              点击歌曲旁的 <Star size={12} className="inline text-ink/50" /> 收藏到歌单。
            </p>
          ) : (
            items.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggle(s);
                }}
                title="点击加载 · 右键移除"
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
                <DifficultyBadge difficulty={s.difficulty} compact />
                {/* 右键移除提示图标 */}
                <span
                  className="text-ink/30 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                >
                  <X size={14} />
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}