"use client";

import type { SongData } from "@/lib/types";
import { isContentWord } from "@/lib/parts";
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

/** 歌词视图：每行内嵌 grid 双栏，日文歌词与中文翻译天然对齐 */
export default function LyricView({ data }: { data: SongData }) {
  const { prefs } = useDisplayPrefs();
  const { open: openAiSettings } = useAiSettings();
  const showBunsetsu = prefs.showBunsetsu;
  const transState = useLineTranslations(data.song, data.lines);
  const needsAiConfig =
    transState.errorCode === "ai_not_configured" ||
    transState.errorCode === "ai_auth_failed";

  // 移动端单列（译文紧随日文行下方）；md 起双列，xl 再放宽译文列。
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
          <div
            key={l.index}
            className={rowClass}
          >
            {/* 日文歌词 */}
            <div className="min-w-0">
              <div className="lyric-wrap font-lyric text-base leading-relaxed text-ink sm:text-lg">
                {l.tokens && l.tokens.length ? (
                  l.tokens.map((t, i) =>
                    isContentWord(t.pos) ? (
                      <TokenWord key={i} token={t} />
                    ) : (
                      <span key={i}>
                        <RubyText segments={t.ruby} />
                      </span>
                    ),
                  )
                ) : (
                  <span>{l.text}</span>
                )}
              </div>
              {showBunsetsu && l.bunsetsu && l.bunsetsu.length ? (
                <BunsetsuRomajiLine bunsetsu={l.bunsetsu} />
              ) : showBunsetsu && l.romaji ? (
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