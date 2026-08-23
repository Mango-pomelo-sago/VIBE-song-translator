import { toHiragana, toRomaji } from "wanakana";
import type { RubySegment } from "./types";

/**
 * 汉字-假名对齐（锚点法）：
 * kuromoji 给出整 token 读音（如「聴か」→ キカ），表面形里的假名串是锚点，
 * 按顺序出现在读音中；汉字段的读音 = 两锚点之间夹的读音。
 */

const KANJI_RE = /[一-鿿々〆]/;
const KANA_RE = /[぀-ゟ゠-ヿ]/;

type Run = { type: "kanji" | "kana" | "other"; text: string };

/** 表面形按连续同型字符分组（汉字/假名/其他） */
export function groupRuns(surface: string): Run[] {
  const runs: Run[] = [];
  for (const ch of surface) {
    let type: Run["type"];
    if (KANJI_RE.test(ch)) type = "kanji";
    else if (KANA_RE.test(ch)) type = "kana";
    else type = "other";
    const last = runs[runs.length - 1];
    if (last && last.type === type) last.text += ch;
    else runs.push({ type, text: ch });
  }
  return runs;
}

/** 小假名 → 基本假名（浊化/音便时锚点宽容匹配） */
const SMALL_TO_BASE: Record<string, string> = {
  ぁ: "あ",
  ぃ: "い",
  ぅ: "う",
  ぇ: "え",
  ぉ: "お",
  っ: "つ",
  ゃ: "や",
  ゅ: "ゆ",
  ょ: "よ",
  ゎ: "わ",
  ヵ: "か",
  ヶ: "け",
};

function normalizeKana(s: string): string {
  let out = "";
  for (const c of s) out += SMALL_TO_BASE[c] ?? c;
  return out;
}

function findAnchor(reading: string, from: number, anchor: string): number {
  // 片假名表面形 → 平假名再匹配（外来语 token，如 フェンス→ふぇんす）
  const a = toHiragana(anchor);
  let idx = reading.indexOf(a, from);
  if (idx < 0) {
    const norm = normalizeKana(a);
    if (norm !== a) idx = reading.indexOf(norm, from);
  }
  return idx;
}

/**
 * 对齐 surface 与 reading，返回 ruby 段 + 警告。
 * 降级策略：假名锚点找不到 → 记 warning、ri 不动；汉字无读音 → reading=null（绝不乱标）。
 */
export function alignSurfaceToReading(
  surface: string,
  readingKana: string | null,
): { segments: RubySegment[]; warnings: string[] } {
  const warnings: string[] = [];
  const runs = groupRuns(surface);

  // 无读音降级：含汉字 → null + warning；纯假名/标点 → 不标注
  if (!readingKana) {
    const segments: RubySegment[] = runs.map((r) => ({
      text: r.text,
      reading: null,
      kind: r.type,
    }));
    if (runs.some((r) => r.type === "kanji")) {
      warnings.push(`no reading for "${surface}"`);
    }
    return { segments, warnings };
  }

  const reading = toHiragana(readingKana);
  const segments: RubySegment[] = [];
  let ri = 0;

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];

    if (run.type === "kana") {
      // 假名锚点：按顺序推进 ri
      const idx = findAnchor(reading, ri, run.text);
      if (idx >= 0) {
        ri = idx + run.text.length;
      } else {
        warnings.push(`anchor "${run.text}" not found in "${reading}"`);
      }
      segments.push({ text: run.text, reading: null, kind: "kana" });
      continue;
    }

    if (run.type === "kanji") {
      // 以其后首个假名 run 为锚点，取其前读音；无锚点读剩余全部
      const nextKana = runs.slice(i + 1).find((r) => r.type === "kana");
      let end = reading.length;
      if (nextKana) {
        let idx = findAnchor(reading, ri, nextKana.text);
        // 锚点恰好命中当前 ri：说明命中的是汉字自身读音（言い→いい 时 い 在 0 处），
        // 汉字至少读 1 个假名，跳过重找，让汉字取到非空切片。
        if (idx === ri) idx = findAnchor(reading, ri + 1, nextKana.text);
        if (idx >= 0) end = idx;
        // 找不到锚点：降级，读剩余全部
      }
      const slice = reading.slice(ri, end);
      if (!slice) {
        segments.push({ text: run.text, reading: null, kind: "kanji" });
        warnings.push(`no reading slice for "${run.text}" in "${reading}"`);
        continue;
      }
      // reading=罗马音（注音默认档），kana=平假名（「假名」档用）
      segments.push({
        text: run.text,
        reading: toRomaji(slice),
        kana: slice,
        kind: "kanji",
      });
      ri = end;
      continue;
    }

    // other（标点/♪/数字等）
    segments.push({ text: run.text, reading: null, kind: "other" });
  }

  return { segments, warnings };
}
