"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Star, ArrowRight } from "lucide-react";
import type { DictEntry, MorphToken } from "@/lib/types";
import { describeVerb } from "@/lib/fr/verbs";
import { fetchEntry } from "./DictionaryCache";
import { level, normalizeJishoJlpt } from "@/lib/jlpt";
import { levelBadgeLabel, levelColor } from "@/lib/lang/meta";
import type { VocabItem } from "@/lib/vocab";
import { useVocab } from "./VocabStore";
import { useLang } from "./LangProvider";

const EDGE = 8; // 与视口边缘的最小间距
const GAP = 6; // 与单词之间的间距

/** 法语词性展示名 */
const FR_POS: Record<string, string> = {
  NOUN: "nom",
  VERB: "verbe",
  AUX: "auxiliaire",
  ADJ: "adjectif",
  ADV: "adverbe",
  PRON: "pronom",
  DET: "déterminant",
  PREP: "préposition",
  CONJ: "conjonction",
  INTJ: "interjection",
  NUM: "numéral",
  UNK: "未知",
};

const LIAISON_LABEL = {
  obligatory: "必须联诵",
  optional: "可选联诵",
  forbidden: "不联诵",
} as const;

/**
 * hover / tap 词卡：读音 + 等级徽章 + 词性 + 释义 + 收藏 + 词典外链。
 * 法语额外显示 IPA、阴阳性、变位、词频、联诵/省音。
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
  const { lang } = useLang();
  const isFr = lang === "fr";
  const saved = has(token.basicForm, lang);
  const tipRef = useRef<HTMLDivElement>(null);
  // 用 ref 持有最新回调，避免定位/监听 effect 因函数标识变化反复重绑
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    let alive = true;
    setState("loading");
    fetchEntry(token.surface, token.basicForm, lang).then((e) => {
      if (!alive) return;
      setEntry(e);
      setState(e ? "ok" : "miss");
    });
    return () => {
      alive = false;
    };
  }, [token.surface, token.basicForm, lang]);

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
      reading: isFr ? token.ipa ?? null : token.reading,
      romaji: isFr ? null : token.romaji,
      level: isFr ? token.level ?? null : lv,
      lang,
      addedAt: Date.now(),
    };
    toggle(item);
  }

  const jishoLv = normalizeJishoJlpt(entry?.jlpt?.[0]);
  const localLv = level(token.basicForm) ?? level(token.surface);
  const lv = isFr
    ? token.level ?? entry?.cefr?.[0] ?? null
    : jishoLv ?? localLv;
  const lvColor = levelColor(lang, lv);
  const displayWord = entry?.word ?? token.surface;
  const reading = (isFr ? token.ipa : null) ?? entry?.reading ?? token.reading;
  const posLabel = isFr ? FR_POS[token.pos] ?? token.pos : token.pos;
  const genderLabel =
    isFr && token.gender
      ? `${token.gender === "m" ? "le" : "la"} · ${token.gender}.`
      : null;
  const verbLabel =
    isFr && token.verb ? describeVerb(token.verb) : null;
  const liaison = isFr ? token.liaison : null;
  const genericPa = (entry?.senses ?? [])
    .flatMap((s) =>
      isFr
        ? (s.definitions ?? []).map((d) => ({ pos: s.partsOfSpeech[0], text: d }))
        : s.english.map((d) => ({ pos: s.partsOfSpeech[0], text: d })),
    )
    .slice(0, 3);

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
          <div
            className={`text-base font-bold leading-tight text-ink ${
              isFr ? "font-lyric-fr" : "font-lyric"
            }`}
          >
            {displayWord}
          </div>
          <p className="font-ipa mt-0.5 text-xs text-ink/60">
            {reading ? reading : ""}
            {!isFr && token.romaji ? ` / ${token.romaji}` : ""}
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
          {levelBadgeLabel(lang, lv)}
        </span>
        {posLabel && token.pos !== "PUNCT" ? (
          <span className="rounded-sm border border-glass-border px-1.5 py-0.5 text-[10px] font-bold text-ink/50">
            {posLabel}
          </span>
        ) : null}
        {genderLabel ? (
          <span className="rounded-sm border border-glass-border px-1.5 py-0.5 text-[10px] font-bold text-ink/50">
            {genderLabel}
          </span>
        ) : null}
        {isFr && token.number ? (
          <span className="rounded-sm border border-glass-border px-1.5 py-0.5 text-[10px] font-bold text-ink/50">
            {token.number === "pl" ? "pl." : "sg."}
          </span>
        ) : null}
        {verbLabel ? (
          <span className="rounded-sm border border-glass-border px-1.5 py-0.5 text-[10px] font-bold text-ink/50">
            {verbLabel}
          </span>
        ) : null}
        {isFr && token.frequency ? (
          <span className="rounded-sm border border-glass-border px-1.5 py-0.5 text-[10px] font-bold text-ink/50">
            词频 {Math.round(token.frequency)}/百万
          </span>
        ) : null}
        {token.elision ? (
          <span className="rounded-sm border border-bauhaus-blue/40 px-1.5 py-0.5 text-[10px] font-bold text-bauhaus-blue">
            省音 · {token.elision.fullForm}
          </span>
        ) : null}
        {liaison ? (
          <span
            className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${
              liaison.type === "forbidden"
                ? "border-ink/20 text-ink/40"
                : "border-bauhaus-blue/40 text-bauhaus-blue"
            }`}
          >
            {LIAISON_LABEL[liaison.type]}
            {liaison.phoneme ? ` /${liaison.phoneme}/` : ""}
          </span>
        ) : null}
      </div>

      {token.gloss ? (
        <div className="mt-2 space-y-0.5">
          <p className="flex items-start gap-1.5 text-xs leading-snug text-ink">
            <span className="mt-px shrink-0 rounded-sm border border-bauhaus-blue/40 px-1 py-px text-[9px] font-bold text-bauhaus-blue">
              AI
            </span>
            <span>{token.gloss}</span>
          </p>
          {token.glossNote ? (
            <p className="pl-7 text-[11px] leading-snug text-ink/55">{token.glossNote}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2">
        {state === "loading" ? (
          <p className="animate-pulse text-xs text-ink/50">查询中…</p>
        ) : state === "miss" || !entry ? (
          <p className="text-xs text-ink/50">
            {isFr ? "暂无中文释义（Wiktionary 未收录）" : "暂无释义（Jisho 未收录）"}
          </p>
        ) : genericPa.length === 0 ? (
          <p className="text-xs text-ink/50">
            {isFr ? "本地词表已收录，暂无释义" : "暂无释义"}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {genericPa.map((s, i) => (
              <li key={i} className="text-xs leading-snug text-ink/85">
                {s.pos ? (
                  <span className="font-bold text-ink/50">{s.pos} · </span>
                ) : null}
                {s.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      <a
        href={
          entry?.url ??
          (isFr
            ? `https://fr.wiktionary.org/wiki/${encodeURIComponent(token.surface)}`
            : `https://jisho.org/search/${encodeURIComponent(token.surface)}`)
        }
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-0.5 text-xs font-semibold text-ink/60 underline decoration-bauhaus-blue/50 underline-offset-2 hover:text-bauhaus-blue"
      >
        {isFr ? "在 Wiktionary 查看" : "在 Jisho 查看"}
        <ArrowRight size={12} />
      </a>
    </div>,
    document.body,
  );
}
