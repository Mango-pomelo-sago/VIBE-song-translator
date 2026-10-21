import type { LyricLine } from "./types";

/** LRC 解析 + tlyric 时间戳对齐 */

/**
 * 元数据行（网易云 LRC 开头常见带时间戳的作词/作曲/编曲等信用信息），
 * 不是真正的歌词，需剔除以免混入歌词并干扰 tlyric 对齐。
 */
const META_LINE_RE =
  /^(作词|作詞|作曲|编曲|編曲|制作人|製作人|监制|監制|混音|母带|母帯|和声|和音|吉他|贝斯|ベース|ドラム|ボーカル|钢琴|ピアノ|弦乐|ストリングス|歌词|歌詞|词|曲|歌|翻译|訳|翻译者|譯|paroles|musique|compos[ée]s?|écrit|produit|r[ée]alis[ée]|arrang[ée]|mix[ée]|lyrics|music|written|produced|arranged)\s*[:：]/i;

function isMetaLine(text: string): boolean {
  return META_LINE_RE.test(text);
}

/**
 * 解析 LRC 文本为按时间排序的行。
 * 支持 `[mm:ss.xx]` / `[mm:ss.xxx]` / 一行多个时间戳；剥离 `[ti:]/[ar:]/[al:]` 等元数据；
 * 应用 `[offset:]`（毫秒，可为负）。
 */
export function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  let offset = 0;

  for (const raw of lrc.split(/\r?\n/)) {
    const line = raw.replace(/^﻿/, "").trim();
    if (!line) continue;

    const meta = line.match(/^\[([a-zA-Z]+):(.*)\]$/);
    if (meta && meta[1].toLowerCase() === "offset") {
      offset = parseInt(meta[2].trim(), 10) || 0;
      continue;
    }

    // 提取本行全部时间戳（每行用全新正则，避免 lastIndex 状态残留）
    const tsRe = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
    const times: number[] = [];
    let m: RegExpExecArray | null;
    while ((m = tsRe.exec(line)) !== null) {
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      const fracMs = m[3]
        ? parseInt(m[3].padEnd(3, "0"), 10)
        : 0;
      times.push(min * 60000 + sec * 1000 + fracMs + offset);
    }
    if (times.length === 0) continue; // 元数据 / 无时间戳行

    const text = line.replace(tsRe, "").trim();
    if (!text || isMetaLine(text)) continue;

    for (const t of times) lines.push({ timeMs: t, text });
  }

  lines.sort((a, b) => a.timeMs - b.timeMs);
  return lines;
}

/**
 * 把 tlyric（中文翻译）按时间戳对齐到 lrc 每一行。
 * 双指针 + 相邻两行取最近，>1200ms 视为无对应翻译。
 */
export function attachZh(
  lrcLines: LyricLine[],
  tlyricLines: LyricLine[],
): LyricLine[] {
  const out = lrcLines.map((l): LyricLine => ({ ...l, zh: null }));
  if (tlyricLines.length === 0) return out;

  let j = 0;
  for (let i = 0; i < out.length; i++) {
    const l = out[i];
    // 推进指针：跳过明显早于当前行的翻译
    while (j < tlyricLines.length && tlyricLines[j].timeMs < l.timeMs - 800) {
      j++;
    }
    let best: LyricLine | null = null;
    let bestDiff = Infinity;
    for (let k = j; k < tlyricLines.length && k <= j + 1; k++) {
      const diff = Math.abs(tlyricLines[k].timeMs - l.timeMs);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = tlyricLines[k];
      }
    }
    if (best && bestDiff <= 1200) l.zh = best.text;
  }
  return out;
}
