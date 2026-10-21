"use client";

import { useRef, useState, type PointerEvent } from "react";
import type { MorphToken } from "@/lib/types";
import { colorFor, level } from "@/lib/jlpt";
import { useDisplayPrefs } from "./DisplayPrefs";
import RubyText from "./RubyText";
import WordTooltip from "./WordTooltip";

/**
 * 可 hover / tap 的内容词：按 JLPT 等级着色，弹出词典 tooltip。
 * 隐藏档（自测）：不显示注音，点击单词临时显示/隐藏。
 * 桌面走 hover（120ms 出现 / 220ms 消失，避免划过时闪烁）；触屏点按开合。
 * 注意：不要加 whitespace-nowrap，长日文句需要在 token 内部断行。
 */
export default function TokenWord({ token }: { token: MorphToken }) {
  const [show, setShow] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const lastPointer = useRef<"mouse" | "touch">("mouse");
  const { prefs } = useDisplayPrefs();
  const lv = level(token.basicForm) ?? level(token.surface);
  const color = colorFor(lv);

  const hiddenMode = prefs.furigana === "hidden" && !revealed;
  const effectiveMode = hiddenMode ? "hidden" : prefs.furigana;

  function clearTimer() {
    if (timer.current) clearTimeout(timer.current);
  }
  function enter() {
    clearTimer();
    timer.current = setTimeout(() => setShow(true), 120);
  }
  function leave() {
    clearTimer();
    timer.current = setTimeout(() => setShow(false), 220);
  }
  function close() {
    clearTimer();
    setShow(false);
  }
  function handlePointerDown(e: PointerEvent<HTMLSpanElement>) {
    lastPointer.current = e.pointerType === "mouse" ? "mouse" : "touch";
  }
  function handleClick() {
    if (lastPointer.current === "touch") {
      // 触屏：一次点按完成查词；隐藏档同时揭示注音
      setShow((s) => !s);
      if (prefs.furigana === "hidden") setRevealed((r) => !r);
      return;
    }
    if (prefs.furigana === "hidden") setRevealed((r) => !r);
  }

  return (
    <span
      ref={anchorRef}
      className={
        "relative inline-block max-w-full " +
        (prefs.furigana === "hidden" ? "cursor-pointer" : "cursor-default")
      }
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") enter();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") leave();
      }}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      title={hiddenMode ? "点击显示注音" : undefined}
    >
      <span className="word-hover-line" style={color ? { color } : undefined}>
        <span className="word-hover-line-text">
          <RubyText segments={token.ruby} mode={effectiveMode} />
        </span>
      </span>
      {show ? (
        <WordTooltip
          token={token}
          anchorRef={anchorRef}
          onHoverStart={enter}
          onHoverEnd={leave}
          onClose={close}
        />
      ) : null}
    </span>
  );
}
