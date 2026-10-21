"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Star, ArrowRight } from "lucide-react";
import type { DictEntry, MorphToken } from "@/lib/types";
import { fetchEntry } from "./DictionaryCache";
import { colorFor, level, normalizeJishoJlpt } from "@/lib/jlpt";
import type { VocabItem } from "@/lib/vocab";
import { useVocab } from "./VocabStore";

const EDGE = 8; // 与视口边缘的最小间距
const GAP = 6; // 与单词之间的间距

/**
 * hover / tap 词卡：读音 + JLPT 徽章 + 词性 + 前 3 条英文释义 + 收藏 + Jisho 链接
 *
 * 定位：渲染到 body 的 portal，`position: fixed` + 手动夹取到视口内。
 * 不能留在 token 内——祖先的 backdrop-filter / transform 会成为 fixed 的包含块。
 */
export default function WordTooltip({
  token,
  anchorRef,
  onHoverStart,
  onHoverEnd,
  onClose,
}: {
  token: MorphToken;
  anchorRef: RefObject<HTMLSpanElement | null>;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onClose?: () => void;
}) {
  const [entry, setEntry] = useState<DictEntry | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "miss">("loading");
  const { has, toggle } = useVocab();
  const saved = has(token.basicForm);
  const tipRef = useRef<HTMLDivElement>(null);
  // 用 ref 持有最新回调，避免定位/监听 effect 因函数标识变化反复重绑
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    let alive = true;
    setState("loading");
    fetchEntry(token.surface, token.basicForm).then((e) => {
      if (!alive) return;
      setEntry(e);
      setState(e ? "ok" : "miss");
    });
    return () => {
      alive = false;
    };
  }, [token.surface, token.basicForm]);

  const place = useCallback(() => {
    const a = anchorRef.current?.getBoundingClientRect();
    const el = tipRef.current;
    if (!a || !el) return;
    const vv = window.visualViewport;
    const vw = vv?.width ?? document.documentElement.clientWidth;
    const vh = vv?.height ?? window.innerHeight;
    const ox = vv?.offsetLeft ?? 0;
    const oy = vv?.offsetTop ?? 0;
    // 先清空尺寸约束之外的坐标，量出自然宽高
    const w = el.offsetWidth;
    const h = el.offsetHeight;

    let left = Math.min(Math.max(a.left, ox + EDGE), ox + vw - w - EDGE);
    if (left < ox + EDGE) left = ox + EDGE;

    let top = a.bottom + GAP;
    if (top + h > oy + vh - EDGE) {
      const above = a.top - GAP - h;
      top = above >= oy + EDGE ? above : Math.max(oy + EDGE, oy + vh - h - EDGE);
    }

    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(top)}px`;
  }, [anchorRef]);

  // 绘制前定位，避免闪一下
  useLayoutEffect(() => {
    place();
  }, [place, entry, state]);

  // 词典数据到达后高度变化、视口尺寸变化时重新定位
  useEffect(() => {
    const el = tipRef.current;
    if (!el) return;
    const ro = new ResizeObserver(place);
    ro.observe(el);
    const onViewport = () => place();
    window.addEventListener("resize", onViewport);
    window.visualViewport?.addEventListener("resize", onViewport);
    window.visualViewport?.addEventListener("scroll", onViewport);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onViewport);
      window.visualViewport?.removeEventListener("resize", onViewport);
      window.visualViewport?.removeEventListener("scroll", onViewport);
    };
  }, [place]);

  // 点击外部 / Esc / 页面滚动 关闭
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node | null;
      if (!t) return;
      if (tipRef.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return; // 点同一个词交给 token 自己 toggle
      closeRef.current?.();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeRef.current?.();
    }
    function onScroll() {
      closeRef.current?.();
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [anchorRef]);

  function handleSave() {
    const item: VocabItem = {
      surface: token.surface,
      basicForm: token.basicForm,
      reading: token.reading,
      romaji: token.romaji,
      level: lv,
      addedAt: Date.now(),
    };
    toggle(item);
  }

  const jishoLv = normalizeJishoJlpt(entry?.jlpt?.[0]);
  const localLv = level(token.basicForm) ?? level(token.surface);
  const lv = jishoLv ?? localLv;
  const lvColor = colorFor(lv);
  const displayWord = entry?.word ?? token.surface;
  const reading = entry?.reading ?? token.reading;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={tipRef}
      className="glass-card fixed left-0 top-0 z-40 min-w-48 p-3 shadow-lg"
      style={{
        backgroundColor: "rgba(255,255,255,0.97)",
        maxWidth: "min(32rem, calc(100vw - 1rem))",
        maxHeight: "calc(100dvh - 1rem)",
        overflowY: "auto",
      }}
      // 桌面从单词移到词卡时取消关闭计时；触屏的合成 enter 不算 hover
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") onHoverStart?.();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") onHoverEnd?.();
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-lyric text-base font-bold leading-tight text-ink">
            {displayWord}
          </div>
          <p className="font-romaji mt-0.5 text-xs text-ink/60">
            {reading ? reading : ""}
            {token.romaji ? ` / ${token.romaji}` : ""}
          </p>
        </div>
        <button
          onClick={handleSave}
          title={saved ? "已收藏，点击取消" : "收藏到生词本"}
          className="shrink-0 leading-none"
          aria-label="收藏到生词本"
        >
          <Star
            size={20}
            className={saved ? "fill-bauhaus-blue text-bauhaus-blue" : "text-ink/30"}
          />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className="rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={lvColor ? { color: lvColor, borderColor: lvColor } : { color: "#8a6da6", borderColor: "#8a6da6" }}
        >
          {lv ? `JLPT ${lv}` : "JLPT 未知"}
        </span>
        {token.pos && token.pos !== "未知" ? (
          <span className="rounded-sm border border-glass-border px-1.5 py-0.5 text-[10px] font-bold text-ink/50">
            {token.pos}
          </span>
        ) : null}
      </div>

      <div className="mt-2">
        {state === "loading" ? (
          <p className="animate-pulse text-xs text-ink/50">查询中…</p>
        ) : state === "miss" || !entry ? (
          <p className="text-xs text-ink/50">暂无释义（Jisho 未收录）</p>
        ) : (
          <ul className="space-y-1.5">
            {entry.senses.slice(0, 3).map((s, i) => (
              <li key={i} className="text-xs leading-snug text-ink/85">
                {s.partsOfSpeech.length ? (
                  <span className="font-bold text-ink/50">{s.partsOfSpeech[0]} · </span>
                ) : null}
                {s.english.slice(0, 3).join("；")}
              </li>
            ))}
          </ul>
        )}
      </div>

      <a
        href={entry?.url ?? `https://jisho.org/search/${encodeURIComponent(token.surface)}`}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-0.5 text-xs font-semibold text-ink/60 underline decoration-bauhaus-blue/50 underline-offset-2 hover:text-bauhaus-blue"
      >
        在 Jisho 查看
        <ArrowRight size={12} />
      </a>
    </div>,
    document.body,
  );
}
