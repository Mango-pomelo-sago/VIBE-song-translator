"use client";

import { useState, useRef, useEffect } from "react";
import SongCandidateCard from "./SongCandidateCard";
import NowPlayingHeader from "./NowPlayingHeader";
import LyricView from "./LyricView";
import DisplaySettings from "./DisplaySettings";
import VocabDrawer from "./VocabDrawer";
import LearningNotesPanel from "./LearningNotesPanel";
import RecommendationPanel from "./RecommendationPanel";
import PlaylistPanel from "./PlaylistPanel";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import type { NeteaseSong, SongData } from "@/lib/types";

type Status = "idle" | "searching" | "results" | "loading" | "song" | "error";

type Props = {
  /** 父组件传入的搜索词，变化时自动触发搜索 */
  searchQuery?: string;
};

/** 搜索 → 选曲 → 歌词双栏 的完整前端流程 */
export default function SearchFlow({ searchQuery }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [candidates, setCandidates] = useState<NeteaseSong[]>([]);
  const [song, setSong] = useState<NeteaseSong | null>(null);
  const [data, setData] = useState<SongData | null>(null);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("");

  const busy = status === "searching" || status === "loading";
  const prevQuery = useRef("");

  // 当父组件传入的 searchQuery 变化时触发搜索
  useEffect(() => {
    const q = (searchQuery ?? "").trim();
    if (q && q !== prevQuery.current) {
      prevQuery.current = q;
      handleSearch(q);
    }
  }, [searchQuery]);

  async function handleSearch(q: string) {
    setLastQuery(q);
    setStatus("searching");
    setError("");
    setSong(null);
    setData(null);
    try {
      const res = await fetch(`/api/search?s=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "搜索失败");
      const cands: NeteaseSong[] = json.candidates ?? [];
      if (cands.length === 0) {
        setStatus("error");
        setError("没有找到相关歌曲，换个关键词试试？");
      } else {
        setCandidates(cands);
        setStatus("results");
      }
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "网络异常，请稍后重试");
    }
  }

  async function handleSelect(c: NeteaseSong) {
    setStatus("loading");
    setError("");
    setSong(c);
    try {
      const res = await fetch("/api/song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song: c }),
      });
      // 服务端异常时可能返回纯文本（如模块加载失败），手动解析避免 JSON.parse 崩溃
      const text = await res.text();
      let json: { ok: boolean; data?: SongData; error?: string };
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`服务器返回异常（HTTP ${res.status}），请稍后重试`);
      }
      if (!json.ok) throw new Error(json.error ?? "歌词加载失败");
      setData(json.data as SongData);
      setStatus("song");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "歌词加载失败，请稍后重试");
    }
  }

  function renderRightColumn() {
    switch (status) {
      case "idle":
        return (
          <div className="animate-fade-up text-center">
            <h2 className="font-sc text-2xl font-bold text-ink sm:text-3xl">
              输入日文歌名，跟着音乐学日语
            </h2>
            <p className="font-sc mt-3 text-sm leading-relaxed text-ink/70">
              罗马音标注 · 文节断句 · hover 查词 · 中文翻译对照
            </p>
          </div>
        );
      case "searching":
        return <LoadingState label={`正在搜索「${lastQuery}」…`} />;
      case "results":
        return (
          <section className="animate-fade-up">
            <p className="font-sc mb-3 text-sm font-semibold text-ink/70">
              「{lastQuery}」的搜索结果
            </p>
            <div className="flex flex-col gap-3">
              {candidates.map((c) => (
                <SongCandidateCard
                  key={c.id}
                  song={c}
                  onSelect={handleSelect}
                  disabled={busy}
                />
              ))}
            </div>
          </section>
        );
      case "loading":
        return <LoadingState label="正在抓取并解析歌词…" />;
      case "song":
        return song && data ? (
          <div className="animate-slide-in-right space-y-4">
            <NowPlayingHeader song={song} difficulty={data.difficulty} />
            <div className="flex flex-wrap items-stretch justify-between gap-3">
              <DisplaySettings />
              <VocabDrawer />
            </div>
            <LyricView data={data} />
            <LearningNotesPanel song={song} lines={data.lines} />
          </div>
        ) : null;
      case "error":
        return (
          <ErrorState
            message={error}
            onRetry={lastQuery ? () => handleSearch(lastQuery) : undefined}
          />
        );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 双栏布局 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* 左栏：我的歌单 + 按难度挑歌 */}
        <aside className="flex flex-col gap-4">
          <PlaylistPanel onSelect={handleSelect} disabled={busy} />
          <RecommendationPanel onSelect={handleSelect} disabled={busy} />
        </aside>

        {/* 右栏：动态内容 */}
        <main className="min-w-0">{renderRightColumn()}</main>
      </div>
    </div>
  );
}