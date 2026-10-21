"use client";

import type { RubySegment } from "@/lib/types";
import type { FuriganaMode } from "@/lib/prefs";
import { useDisplayPrefs } from "./DisplayPrefs";

/** 渲染一行歌词：汉字上方标假名/罗马音，法语单词上方标 IPA，其余照常。
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
        const annotated = seg.kind === "kanji" || seg.kind === "ipa";
        if (annotated && seg.reading && m !== "hidden") {
          // 法语 IPA 没有假名档；即便偏好里残留 kana 也显示音标
          const rt =
            seg.kind === "ipa"
              ? seg.reading
              : m === "kana"
                ? seg.kana ?? seg.reading
                : seg.reading;
          return (
            <ruby
              key={i}
              className={seg.kind === "ipa" ? "ruby-inline ruby-ipa" : "ruby-inline"}
            >
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
