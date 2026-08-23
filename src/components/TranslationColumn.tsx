"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NeteaseSong, ProcessedLine } from "@/lib/types";

/**
 * 中文翻译：优先网易云 tlyric；缺失行自动调 /api/translate 批量补齐（带 AI 标签）。
 * 拆分出 useLineTranslations hook（管理批量补齐请求）+ LineTranslation 单行渲染，
 * 供 LyricView 在「每行内嵌 grid」中逐行对齐渲染。
 */
export type TranslationState = {
  /** index → 补齐的中文 */
  extra: Record<number, string>;
  /** index → 由 AI 补齐 */
  aiIndexes: Set<number>;
  status: "idle" | "loading" | "done" | "error";
  errorMsg: string | null;
  run: () => void;
  /** 该行是否在等待 AI 补齐 */
  waiting: (index: number) => boolean;
};

export function useLineTranslations(
  song: NeteaseSong,
  lines: ProcessedLine[],
): TranslationState {
  const [extra, setExtra] = useState<Record<number, string>>({});
  const [aiIndexes, setAiIndexes] = useState<Set<number>>(() => new Set());
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const missingRef = useRef<Set<number>>(new Set());
  const attempted = useRef(false);

  const missing = lines.filter((l) => !l.zh && l.text && l.text.trim());

  const run = useCallback(async () => {
    setStatus("loading");
    setErrorMsg(null);
    const payload = {
      songId: song.id,
      songName: song.name,
      artists: song.artists?.map((a) => a.name).join(" / ") ?? "",
      missing: missing.map((l) => ({ index: l.index, text: l.text })),
    };
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        translations?: Array<{ index: number; zh: string }>;
      };
      if (!data.ok) {
        setErrorMsg(data.error ?? "AI 翻译失败");
        setStatus("error");
        return;
      }
      const map: Record<number, string> = {};
      const idx = new Set<number>();
      for (const t of data.translations ?? []) {
        map[t.index] = t.zh;
        idx.add(t.index);
      }
      setExtra(map);
      setAiIndexes(idx);
      setStatus("done");
    } catch {
      setErrorMsg("AI 翻译失败，请稍后重试");
      setStatus("error");
    }
  }, [song.id, song.name, song.artists, missing]);

  // 只跑一次（对缺失行快照）
  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    for (const l of missing) missingRef.current.add(l.index);
    if (missingRef.current.size === 0) {
      setStatus("done");
      return;
    }
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    extra,
    aiIndexes,
    status,
    errorMsg,
    run,
    waiting: (index) =>
      status === "loading" && missingRef.current.has(index),
  };
}

/** 单行中文翻译（含 AI 补齐标记） */
export function LineTranslation({
  line,
  state,
}: {
  line: ProcessedLine;
  state: TranslationState;
}) {
  const aiZh = state.extra[line.index];
  const isAi = state.aiIndexes.has(line.index) || !!aiZh;
  const text = line.zh ?? aiZh;
  const waiting = state.waiting(line.index);

  return (
    <p className="font-sc relative text-sm leading-relaxed text-ink/80">
      {text ? (
        <>
          {isAi ? (
            <span
              title="DeepSeek AI 翻译"
              className="mr-1 rounded-sm bg-bauhaus-blue px-1 py-px align-middle text-[9px] font-bold text-white"
            >
              AI
            </span>
          ) : null}
          {text}
        </>
      ) : waiting ? (
        <span className="animate-pulse text-ink-lighter">翻译中…</span>
      ) : (
        <span className="text-ink-lighter">—</span>
      )}
    </p>
  );
}