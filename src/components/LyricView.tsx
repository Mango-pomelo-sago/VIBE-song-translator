"use client";

import { Fragment, useEffect, useState } from "react";
import type { MorphToken, SongData } from "@/lib/types";
import { isContentWord } from "@/lib/parts";
import { aiConfigHeaders, isAiConfigComplete, loadAiConfig } from "@/lib/ai-config";
import { useDisplayPrefs } from "./DisplayPrefs";
import { useAiSettings } from "./AiSettings";
import RubyText from "./RubyText";
import BunsetsuRomajiLine from "./BunsetsuRomajiLine";
import TokenWord from "./TokenWord";
import SdfLensBlur from "./SdfLensBlur";
import {
  useLineTranslations,
  LineTranslation,
} from "./TranslationColumn";

type AiGloss = { gloss: string; note: string | null };

/** 歌词视图：每行内嵌 grid 双栏，歌词与中文翻译天然对齐 */
export default function LyricView({ data }: { data: SongData }) {
  const { prefs } = useDisplayPrefs();
  const { open: openAiSettings } = useAiSettings();
  const showBunsetsu = prefs.showBunsetsu;
  const lang = data.lang ?? "ja";
  const isFr = lang === "fr";
  const transState = useLineTranslations(data.song, data.lines, lang);
  const needsAiConfig =
    transState.errorCode === "ai_not_configured" ||
    transState.errorCode === "ai_auth_failed";

  // 法语：本地标注渲染后异步补中文释义；未配置 key 则完全不请求
  const [aiGloss, setAiGloss] = useState<Record<string, AiGloss>>({});
  useEffect(() => {
    setAiGloss({});
    if (!isFr) return;
    const config = loadAiConfig();
    if (!isAiConfigComplete(config)) return;
    const lines = data.lines
      .filter((l) => l.text.trim())
      .map((l) => ({ index: l.index, text: l.text }));
    if (lines.length === 0) return;

    const ctrl = new AbortController();
    let alive = true;
    fetch("/api/annotate", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", ...aiConfigHeaders(config) },
      body: JSON.stringify({ songId: data.song.id, lang, lines }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: unknown) => {
        if (!alive) return;
        const payload = json as { ok?: boolean; lemmas?: unknown } | null;
        if (!payload?.ok || !Array.isArray(payload.lemmas)) return;
        const map: Record<string, AiGloss> = {};
        for (const raw of payload.lemmas as Array<{
          lemma?: unknown;
          glossZh?: unknown;
          note?: unknown;
        }>) {
          if (typeof raw.lemma !== "string" || typeof raw.glossZh !== "string") continue;
          map[raw.lemma.toLowerCase()] = {
            gloss: raw.glossZh,
            note: typeof raw.note === "string" && raw.note.trim() ? raw.note : null,
          };
        }
        setAiGloss(map);
      })
      .catch(() => {
        // 增强失败不影响本地标注；下次进入歌曲再试
      });
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [data.song.id, data.lines, isFr, lang]);

  // 移动端单列（译文紧随歌词行下方）；md 起双列，xl 再放宽译文列。
  // minmax(0,1fr) 而非 1fr：压掉 grid 子项的自动最小尺寸，避免被长歌词撑开。
  const rowClass =
    "mb-3 grid grid-cols-1 gap-y-1 md:gap-6 " +
    (prefs.showTranslation
      ? "md:grid-cols-[minmax(0,1fr)_200px] xl:grid-cols-[minmax(0,1fr)_280px]"
      : "");

  return (
    <div className="glass-card relative p-4 sm:p-6">
      <SdfLensBlur />
      <div className="relative z-10">
        {data.lines.map((l) => (
          <div key={l.index} className={rowClass}>
            {/* 歌词 */}
            <div className="min-w-0">
              <div
                className={`lyric-wrap text-base leading-relaxed text-ink sm:text-lg ${
                  isFr ? "font-lyric-fr" : "font-lyric"
                }`}
              >
                {l.tokens && l.tokens.length ? (
                  l.tokens.map((t, i) => {
                    const isContent = t.content ?? isContentWord(t.pos);
                    // AI 只补 gloss / note，本地 IPA、CEFR、阴阳性、变位保持原值
                    const ai = aiGloss[t.basicForm.toLowerCase()];
                    const token: MorphToken =
                      ai && !t.gloss
                        ? {
                            ...t,
                            gloss: ai.gloss,
                            glossNote: t.glossNote ?? ai.note,
                          }
                        : t;
                    return (
                      <Fragment key={i}>
                        {isFr && t.spaceBefore && i > 0 ? " " : null}
                        {isContent ? (
                          <TokenWord token={token} />
                        ) : (
                          <span className={isFr && t.elision ? "elision-mark" : undefined}>
                            <RubyText segments={t.ruby} />
                          </span>
                        )}
                      </Fragment>
                    );
                  })
                ) : (
                  <span>{l.text}</span>
                )}
              </div>
              {showBunsetsu && l.bunsetsu && l.bunsetsu.length ? (
                <BunsetsuRomajiLine bunsetsu={l.bunsetsu} lang={lang} />
              ) : showBunsetsu && !isFr && l.romaji ? (
                <p className="lyric-wrap font-romaji mt-0.5 text-xs leading-relaxed text-ink/55">
                  {l.romaji}
                </p>
              ) : null}
            </div>

            {/* 中文翻译：移动端在行下，用左侧细线区分 */}
            {prefs.showTranslation ? (
              <div className="min-w-0 border-l-2 border-bauhaus-blue/20 pl-2 md:border-0 md:pl-0">
                <LineTranslation line={l} state={transState} />
              </div>
            ) : null}
          </div>
        ))}

        {/* 翻译失败重试 */}
        {transState.status === "error" ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <button
              onClick={() => transState.run()}
              className="font-semibold text-bauhaus-blue underline underline-offset-2"
            >
              AI 翻译失败（{transState.errorMsg ?? "重试"}），点击重试
            </button>
            {needsAiConfig ? (
              <button
                onClick={openAiSettings}
                className="rounded border border-glass-border bg-glass-bg px-2 py-0.5 font-semibold text-ink/70 transition-colors hover:bg-glass-hover"
              >
                去配置
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
