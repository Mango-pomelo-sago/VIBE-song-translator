"use client";

import { useRef, useState } from "react";
import type { MorphToken } from "@/lib/types";
import { colorFor, level } from "@/lib/jlpt";
import { useDisplayPrefs } from "./DisplayPrefs";
import RubyText from "./RubyText";
import WordTooltip from "./WordTooltip";

/**
 * 可 hover 的内容词：按 JLPT 等级着色，悬停弹出词典 tooltip。
 * 隐藏档（自测）：不显示注音，点击单词临时显示/隐藏。
 * 延迟出现/消失避免划过单词时频繁闪烁。
 */
export default function TokenWord({ token }: { token: MorphToken }) {
  const [show, setShow] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { prefs } = useDisplayPrefs();
  const lv = level(token.basicForm) ?? level(token.surface);
  const color = colorFor(lv);

  const hiddenMode = prefs.furigana === "hidden" && !revealed;
  const effectiveMode = hiddenMode ? "hidden" : prefs.furigana;

  function enter() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(true), 120);
  }
  function leave() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 220);
  }
  function handleClick() {
    if (prefs.furigana === "hidden") setRevealed((r) => !r);
  }

  return (
    <span
      className={
        "relative inline-block whitespace-nowrap " +
        (prefs.furigana === "hidden" ? "cursor-pointer" : "cursor-default")
      }
      onMouseEnter={enter}
      onMouseLeave={leave}
      onClick={handleClick}
      title={hiddenMode ? "点击显示注音" : undefined}
    >
      <span className="word-hover-line" style={color ? { color } : undefined}>
        <span className="word-hover-line-text">
          <RubyText segments={token.ruby} mode={effectiveMode} />
        </span>
      </span>
      {show ? <WordTooltip token={token} /> : null}
    </span>
  );
}
