"use client";

import { useRef, useState, type PointerEvent } from "react";
import type { MorphToken } from "@/lib/types";
import { level } from "@/lib/jlpt";
import { FR_GRAMMAR_COLORS, annotationModeFor, levelColor } from "@/lib/lang/meta";
import { grammarCategory, grammarTag } from "@/lib/fr/verbs";
import { matchesGrammarFocus, type GrammarFocus } from "@/lib/fr/grammar";
import { useLang } from "./LangProvider";
import { useDisplayPrefs } from "./DisplayPrefs";
import RubyText from "./RubyText";
import WordTooltip from "./WordTooltip";

/**
 * 可 hover / tap 的内容词：按 JLPT 等级着色，弹出词典 tooltip。
 * 隐藏档（自测）：不显示注音，点击单词临时显示/隐藏。
 * 桌面走 hover（120ms 出现 / 220ms 消失，避免划过时闪烁）；触屏点按开合。
 * 注意：不要加 whitespace-nowrap，长日文句需要在 token 内部断行。
 */
export default function TokenWord({
  token,
  focus = null,
}: {
  token: MorphToken;
  focus?: GrammarFocus | null;
}) {
  const [show, setShow] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const lastPointer = useRef<"mouse" | "touch">("mouse");
  const { prefs } = useDisplayPrefs();
  const { lang } = useLang();
  const isFr = lang === "fr";
  // 法语等级直接来自 token（CEFR）；日语继续查本地 JLPT 词表
  const lv = token.level ?? level(token.basicForm) ?? level(token.surface);
  const color = levelColor(lang, lv);
  const annotation = annotationModeFor(lang, prefs.furigana);

  // 法语用语法标签替代发音：名词阴阳性/单复数、动词时态人称
  const grammar = isFr && prefs.showGrammar ? grammarTag(token) : null;
  const grammarKind = grammar ? grammarCategory(token) : null;

  // 本曲语法筛选：命中的词保持原样，其余内容词淡出
  const dimmed = isFr && focus ? !matchesGrammarFocus(token, focus) : false;
  const highlighted = isFr && !!focus && !dimmed;

  // 自测隐藏档只对日语有意义（法语不显示发音）
  const hiddenMode = !isFr && annotation === "hidden" && !revealed;
  const effectiveMode = hiddenMode ? "hidden" : annotation;

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
      // 触屏：一次点按完成查词；隐藏档同时揭示注音（仅日语）
      setShow((s) => !s);
      if (!isFr && annotation === "hidden") setRevealed((r) => !r);
      return;
    }
    if (!isFr && annotation === "hidden") setRevealed((r) => !r);
  }

  return (
    <span
      ref={anchorRef}
      className={
        "relative inline-block max-w-full transition-opacity " +
        (dimmed ? "opacity-25 " : "") +
        (highlighted ? "rounded-[4px] bg-bauhaus-yellow/20 " : "") +
        (hiddenMode ? "cursor-pointer" : "cursor-default")
      }
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") enter();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") leave();
      }}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      title={hiddenMode ? "点击显示发音标注" : undefined}
    >
      <span className="word-hover-line" style={color ? { color } : undefined}>
        <span className="word-hover-line-text">
          {grammar ? (
            <ruby className="ruby-grammar">
              {token.surface}
              <rt
                style={
                  grammarKind
                    ? { color: FR_GRAMMAR_COLORS[grammarKind] }
                    : undefined
                }
              >
                {grammar}
              </rt>
            </ruby>
          ) : (
            <RubyText segments={token.ruby} mode={effectiveMode} />
          )}
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
