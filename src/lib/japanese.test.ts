import { describe, expect, it } from "vitest";
import { applyReadingOverrides, READING_OVERRIDES } from "./japanese";
import type { MorphToken } from "./types";

function tok(surface: string, reading: string, pos = "名詞"): MorphToken {
  return {
    surface,
    reading,
    basicForm: surface,
    pos,
    posDetail: "",
    ruby: [],
    romaji: null,
  };
}

describe("READING_OVERRIDES 读音覆盖", () => {
  it("二人 → ふたり，并重建 ruby 与 romaji", () => {
    const t = applyReadingOverrides([tok("二人", "ににん")])[0];
    expect(t.reading).toBe("ふたり");
    expect(t.ruby).toMatchObject([{ text: "二人", reading: "futari", kind: "kanji" }]);
    expect(t.romaji).toBe("futari");
  });

  it("非覆盖词不受影响", () => {
    const t = applyReadingOverrides([tok("空", "そら")])[0];
    expect(t.reading).toBe("そら");
    expect(t.romaji).toBeNull(); // 原样保留（未重建）
  });

  it("复合词 surface 不同，不误伤", () => {
    const t = applyReadingOverrides([tok("二人三脚", "ににんさんきゃく")])[0];
    expect(t.reading).toBe("ににんさんきゃく");
  });

  it("覆盖词但 reading 已正确 → 原样", () => {
    const t = applyReadingOverrides([tok("一人", "ひとり")])[0];
    expect(t.reading).toBe("ひとり");
    expect(t.romaji).toBeNull(); // 已正确，跳过重建
  });

  it("跨 token 合并：二[に]+人[にん] → 二人[ふたり]（kuromoji 实测分词形态）", () => {
    const merged = applyReadingOverrides([
      tok("二", "に"),
      tok("人", "にん"),
      tok("だけ", "だけ", "助詞"),
      tok("の", "の", "助詞"),
    ]);
    expect(merged.map((t) => t.surface)).toEqual(["二人", "だけ", "の"]);
    expect(merged[0].reading).toBe("ふたり");
    expect(merged[0].romaji).toBe("futari");
    expect(merged[0].ruby).toMatchObject([
      { text: "二人", reading: "futari", kind: "kanji" },
    ]);
  });

  it("不跨 token 过度合并：二と人（二+と+人 拼接不命中）", () => {
    const merged = applyReadingOverrides([
      tok("二", "に"),
      tok("と", "と", "助詞"),
      tok("人", "にん"),
    ]);
    expect(merged.map((t) => t.surface)).toEqual(["二", "と", "人"]);
  });

  it("覆盖表含常用词", () => {
    expect(READING_OVERRIDES["二人"]).toBe("ふたり");
    expect(READING_OVERRIDES["一人"]).toBe("ひとり");
  });
});
