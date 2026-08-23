"use client";

import { useState } from "react";
import { Disc3 } from "lucide-react";
import type { NeteaseSong } from "@/lib/types";
import SdfLensBlur from "./SdfLensBlur";

function fmtDuration(ms?: number | null): string {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

type Props = {
  song: NeteaseSong;
  onSelect: (song: NeteaseSong) => void;
  disabled?: boolean;
};

export default function SongCandidateCard({ song, onSelect, disabled }: Props) {
  const [imgErr, setImgErr] = useState(false);
  const pic = !imgErr ? song.album?.picUrl : null;

  return (
    <div className="relative">
      <SdfLensBlur />
      <button
        type="button"
        onClick={() => onSelect(song)}
        disabled={disabled}
        className="glass-card group relative z-10 flex w-full items-center gap-4 p-3 text-left transition-all hover:bg-glass-hover disabled:cursor-wait disabled:opacity-70"
      >
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-glass-border bg-glass-bg">
          {pic ? (
            // eslint-disable-next-line @next/next/no-img-element -- 网易云封面走 img（有 hotlink 限制）
            <img
              src={pic}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl" aria-hidden>
              <Disc3 className="text-ink/50" size={20} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-sc truncate text-base font-bold text-ink">{song.name}</p>
          <p className="font-sc truncate text-sm text-ink/70">
            {song.artists.map((a) => a.name).join(" · ")}
            {song.album?.name ? ` — ${song.album.name}` : ""}
          </p>
        </div>
        {song.durationMs ? (
          <span className="font-romaji shrink-0 text-xs text-ink/60">
            {fmtDuration(song.durationMs)}
          </span>
        ) : null}
      </button>
    </div>
  );
}