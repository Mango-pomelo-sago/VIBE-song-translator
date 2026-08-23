"use client";

import { useState, type FormEvent } from "react";

const SUGGESTIONS = ["夜に駆ける", "Lemon", "Pretender", "アポロ"];

type Props = {
  /** 提交搜索（M2 接入 /api/search） */
  onSearch?: (query: string) => void;
  disabled?: boolean;
};

export default function SearchBar({ onSearch, disabled = false }: Props) {
  const [query, setQuery] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    onSearch?.(q);
  }

  return (
    <div>
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入日文歌名，如：夜に駆ける"
          aria-label="歌名搜索"
          className="glass-input flex-1"
        />
        <button
          type="submit"
          disabled={disabled}
          className="bauhaus-btn bauhaus-btn-blue shrink-0 px-8 py-3 text-base disabled:cursor-not-allowed disabled:opacity-60"
        >
          搜索
        </button>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="font-sc text-xs font-bold uppercase tracking-widest text-ink/50">
          Try
        </span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQuery(s);
              onSearch?.(s);
            }}
            className="rounded-lg border border-glass-border bg-glass-bg px-3 py-1 font-sc text-sm font-semibold text-ink transition-colors hover:bg-glass-hover"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}