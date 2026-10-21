"use client";

import type { RubySegment } from "@/lib/types";
import type { FuriganaMode } from "@/lib/prefs";
import { useDisplayPrefs } from "./DisplayPrefs";

/** 渲染一行歌词：日语汉字上方标假名/罗马音，其余照常。
 *  法语不再标注发音（IPA 只保留在词卡里），法语单词的语法标签由 TokenWord 负责。
 *  注音三档：罗马音 / 假名（kana）/ 隐藏（hidden，自测不标注）。
 *  mode 可覆盖全局偏好（隐藏模式下点击单词临时显示注音时用）。 */
export default function RubyText({
  segments,
  mode,
}: {
  segments: RubySegment[];
  mode?: FuriganaMode;
}) {
  const { prefs } = useDisplayPrefs();
  const m = mode ?? prefs.furigana;

  return (
    <>
      {segments.map((seg, i) => {
        const annotated = seg.kind === "kanji";
        if (annotated && seg.reading && m !== "hidden") {
          const rt = m === "kana" ? seg.kana ?? seg.reading : seg.reading;
          return (
            <ruby key={i} className="ruby-inline">
              {seg.text}
              <rt>{rt}</rt>
            </ruby>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </>
  );
}
