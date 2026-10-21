"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
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
import { LANG_META } from "@/lib/lang/meta";
import type { LangCode, NeteaseSong, SongData } from "@/lib/types";

type Status = "idle" | "searching" | "results" | "loading" | "song" | "error";

type Props = {
  /** 父组件传入的搜索词，变化时自动触发搜索 */
  searchQuery?: string;
  /** 学习语言；由页面传入并随语言切换重挂载 */
  lang: LangCode;
};

/** 搜索 → 选曲 → 歌词双栏 的完整前端流程 */
export default function SearchFlow({ searchQuery, lang }: Props) {
  const meta = LANG_META[lang];
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  /** 移动端回到页面顶部（挑歌面板会隐藏，内容从顶部开始） */
  function scrollTopOnMobile() {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches
    ) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleSearch(q: string) {
    setLastQuery(q);
    setStatus("searching");
    setError("");
    setSong(null);
    setData(null);
    scrollTopOnMobile();
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
        body: JSON.stringify({ song: c, lang }),
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
      scrollTopOnMobile();
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "歌词加载失败，请稍后重试");
    }
  }

  /** 移动端从当前歌曲回到挑歌面板 */
  function backToPicker() {
    setStatus("idle");
    setSong(null);
    setData(null);
    setError("");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  /** 移动端返回按钮：挑歌面板在非 idle 状态下隐藏，需要一个回到首页的入口 */
  function backButton() {
    return (
      <button
        onClick={backToPicker}
        className="glass-card mb-4 flex items-center gap-1.5 px-3 py-1.5 font-sc text-xs font-bold text-ink/70 lg:hidden"
      >
        <ArrowLeft size={14} />
        返回挑歌
      </button>
    );
  }

  function renderRightColumn() {
    switch (status) {
      case "idle":
        return (
          <div className="animate-fade-up text-center">
            <h2 className="font-sc text-2xl font-bold text-ink sm:text-3xl">
              {meta.idleHeading}
            </h2>
            <p className="font-sc mt-3 text-sm leading-relaxed text-ink/70">
              {meta.idleSubline}
            </p>
          </div>
        );
      case "searching":
        return <LoadingState label={`正在搜索「${lastQuery}」…`} />;
      case "results":
        return (
          <section className="animate-fade-up">
            {backButton()}
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
            {backButton()}
            <NowPlayingHeader song={song} difficulty={data.difficulty} />
            <div className="flex flex-wrap items-stretch justify-between gap-3">
              <DisplaySettings />
              <div className="ml-auto flex items-center">
                <VocabDrawer />
              </div>
            </div>
            <LyricView data={data} />
            <LearningNotesPanel song={song} lines={data.lines} lang={lang} />
          </div>
        ) : null;
      case "error":
        return (
          <div>
            {backButton()}
            <ErrorState
              message={error}
              onRetry={lastQuery ? () => handleSearch(lastQuery) : undefined}
            />
          </div>
        );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 双栏布局 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* 左栏：我的歌单 + 按难度挑歌（移动端只在 idle 显示；搜索/歌词时隐藏，避免把内容推到首屏之外） */}
        <aside
          className={
            status === "idle"
              ? "flex flex-col gap-4"
              : "hidden flex-col gap-4 lg:flex"
          }
        >
          <PlaylistPanel onSelect={handleSelect} disabled={busy} lang={lang} />
          <RecommendationPanel
            onSelect={handleSelect}
            disabled={busy}
            lang={lang}
          />
        </aside>

        {/* 右栏：动态内容 */}
        <main className="min-w-0">{renderRightColumn()}</main>
      </div>
    </div>
  );
}