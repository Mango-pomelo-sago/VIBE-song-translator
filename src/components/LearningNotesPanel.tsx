"use client";

import { useState } from "react";
import { GraduationCap, ChevronDown } from "lucide-react";
import { aiConfigHeaders, loadAiConfig } from "@/lib/ai-config";
import type { LearningNotes } from "@/lib/notes";
import type { NeteaseSong, ProcessedLine } from "@/lib/types";
import { useAiSettings } from "./AiSettings";
import SdfLensBlur from "./SdfLensBlur";

// 客户端内存缓存：同一首歌折叠再展开不重新请求
const clientCache = new Map<number, LearningNotes>();

/** AI 学习笔记面板：歌曲背景 + 文化札记 + 语法札记（懒加载，展开时才调 /api/notes） */
export default function LearningNotesPanel({
  song,
  lines,
}: {
  song: NeteaseSong;
  lines: ProcessedLine[];
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [notes, setNotes] = useState<LearningNotes | null>(
    () => clientCache.get(song.id) ?? null,
  );
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const { open: openAiSettings } = useAiSettings();

  async function load() {
    setStatus("loading");
    setErrorCode(null);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 请求时同步读取本机配置，保存设置后重试立即生效
          ...aiConfigHeaders(loadAiConfig()),
        },
        body: JSON.stringify({
          songId: song.id,
          title: song.name,
          artist: song.artists?.map((a) => a.name).join(" / ") ?? "",
          lines,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        code?: string;
        error?: string;
        notes?: LearningNotes;
      };
      if (!data.ok || !data.notes) {
        setErrorCode(data.code ?? null);
        throw new Error(data.error ?? "笔记生成失败");
      }
      clientCache.set(song.id, data.notes);
      setNotes(data.notes);
      setStatus("ok");
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络异常");
      setStatus("error");
    }
  }

  const needsAiConfig =
    errorCode === "ai_not_configured" || errorCode === "ai_auth_failed";

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (status === "ok" || notes) return;
    void load();
  }

  return (
    <div className="glass-card relative">
      <SdfLensBlur />
      <div className="relative z-10">
        <button
          onClick={toggle}
          className="flex w-full items-center justify-between px-4 py-3"
          aria-expanded={open}
        >
          <span className="flex min-w-0 items-center gap-2 text-left font-sc text-sm font-bold text-ink">
            <GraduationCap size={18} className="text-bauhaus-blue" />
            学习笔记
            <span className="hidden font-sc text-[10px] font-normal text-ink/45 sm:inline">
              （AI 生成：背景 · 文化 · 语法）
            </span>
          </span>
          <span
            className={`flex items-center text-bauhaus-blue transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            <ChevronDown size={18} />
          </span>
        </button>

        {open ? (
          <div className="border-t border-glass-border p-4">
            {status === "loading" ? (
              <div className="animate-pulse space-y-2 py-2">
                <div className="h-3 w-2/3 rounded bg-glass-strong" />
                <div className="h-3 w-1/2 rounded bg-glass-strong" />
                <div className="h-3 w-3/4 rounded bg-glass-strong" />
              </div>
            ) : status === "error" ? (
              <div className="py-2 text-sm">
                <p className="text-ink/60">{error}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <button
                    onClick={() => void load()}
                    className="text-xs font-semibold text-bauhaus-blue underline underline-offset-2"
                  >
                    点击重试
                  </button>
                  {needsAiConfig ? (
                    <button
                      onClick={openAiSettings}
                      className="rounded border border-glass-border bg-glass-bg px-2 py-0.5 text-xs font-semibold text-ink/70 transition-colors hover:bg-glass-hover"
                    >
                      去配置
                    </button>
                  ) : null}
                </div>
              </div>
            ) : notes ? (
              <div className="space-y-4">
                <section>
                  <h4 className="font-sc text-xs font-bold uppercase tracking-widest text-bauhaus-blue">
                    歌曲背景
                  </h4>
                  <p className="font-sc mt-1.5 text-sm leading-relaxed text-ink/85">
                    {notes.background}
                  </p>
                </section>

                {notes.cultural.length ? (
                  <section>
                    <h4 className="font-sc text-xs font-bold uppercase tracking-widest text-bauhaus-blue">
                      文化札记
                    </h4>
                    <ul className="mt-2 space-y-3">
                      {notes.cultural.map((c, i) => (
                        <li key={i} className="border-l-3 border-bauhaus-blue/30 pl-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-sm border border-bauhaus-blue/40 px-1.5 py-px font-sc text-[10px] font-bold text-bauhaus-blue">
                              {c.snippet}
                            </span>
                            <span className="font-sc text-xs font-bold text-ink/90">{c.title}</span>
                          </div>
                          <p className="font-sc mt-1 text-sm leading-relaxed text-ink/80">
                            {c.detail}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {notes.grammar.length ? (
                  <section>
                    <h4 className="font-sc text-xs font-bold uppercase tracking-widest text-bauhaus-blue">
                      语法札记
                    </h4>
                    <ul className="mt-2 space-y-3">
                      {notes.grammar.map((g, i) => (
                        <li key={i} className="rounded-lg border border-glass-border bg-glass-bg p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-sm bg-bauhaus-blue/10 px-1.5 py-px font-sc text-sm font-bold text-bauhaus-blue">
                              {g.pattern}
                            </span>
                            <span className="font-sc text-sm font-bold text-ink/90">
                              {g.meaning}
                            </span>
                          </div>
                          <p className="font-sc mt-1 text-xs leading-relaxed text-ink/60">
                            {g.rule}
                          </p>
                          <p className="font-lyric mt-1.5 text-sm leading-relaxed text-ink/90">
                            {g.example}
                          </p>
                          <p className="font-sc mt-0.5 text-xs leading-relaxed text-ink/55">
                            {g.translation}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}