import { toHiragana, toRomaji } from "wanakana";

/**
 * 整 token 罗马音。
 * 助词例外：は→wa、へ→e、を→o；常见寒暄语修正（こんにちは→konnichiwa）。
 */

const GREETINGS: Record<string, string> = {
  こんにちは: "konnichiwa",
  こんばんは: "konbanwa",
};

/** 寒暄语的假名改写（把 は 改成 わ，再整体转写） */
const GREETING_KANA: Record<string, string> = {
  こんにちは: "こんにちわ",
  こんばんは: "こんばんわ",
};

const PARTICLE_KANA: Record<string, string> = {
  は: "わ",
  へ: "え",
  を: "お",
};

/** 平假名/片假名 全假名判定（用于无读音时按表面形转写） */
const ALL_KANA_RE = /^[぀-ヿ]+$/;

export function tokenRomaji(
  readingKana: string | null,
  surface: string,
  pos: string,
): string | null {
  if (pos === "記号" || pos === "空白") return null;
  if (!readingKana) {
    // 无读音：纯假名表面形直接转写（外来语等）；含汉字 → null
    if (ALL_KANA_RE.test(surface)) return toRomaji(toHiragana(surface));
    return null;
  }

  let kana = toHiragana(readingKana);
  const greeting = GREETINGS[kana];
  if (greeting) return greeting;

  if (pos === "助詞") {
    kana = kana
      .split("")
      .map((c) => PARTICLE_KANA[c] ?? c)
      .join("");
  }
  return toRomaji(kana);
}

/**
 * 行/文节级罗马音用的逐 token 假名字符串：
 * 已做助词例外、寒暄语改写、记号/空白剔除；可直接拼接后整体 toRomaji（解决跨 token 促音，如 分かっ+た→wakatta）。
 */
export function displayKana(token: {
  reading: string | null;
  surface: string;
  pos: string;
}): string {
  if (token.pos === "記号" || token.pos === "空白") return "";
  if (token.reading) {
    const kana = toHiragana(token.reading);
    if (token.pos === "助詞") {
      return kana
        .split("")
        .map((c) => PARTICLE_KANA[c] ?? c)
        .join("");
    }
    return GREETING_KANA[kana] ?? kana;
  }
  if (ALL_KANA_RE.test(token.surface)) return toHiragana(token.surface);
  return "";
}
