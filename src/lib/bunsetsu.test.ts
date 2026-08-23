import { describe, expect, it } from "vitest";
import { segmentBunsetsu } from "./bunsetsu";
import type { MorphToken } from "./types";

function tok(surface: string, pos: string, reading: string | null): MorphToken {
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

describe("segmentBunsetsu 文节断句", () => {
  it("名詞+助詞 → 内容词开新文节，助词追加", () => {
    const bs = segmentBunsetsu([
      tok("二人", "名詞", "ふたり"),
      tok("だけ", "助詞", "だけ"),
      tok("の", "助詞", "の"),
      tok("空", "名詞", "そら"),
      tok("が", "助詞", "が"),
      tok("広がる", "動詞", "ひろがる"),
      tok("夜", "名詞", "よる"),
      tok("に", "助詞", "に"),
    ]);
    expect(bs.map((b) => b.text)).toEqual(["二人だけの", "空が", "広がる", "夜に"]);
    expect(bs.map((b) => b.romaji)).toEqual([
      "futari dake no",
      "sora ga",
      "hirogaru",
      "yoru ni",
    ]);
    // 助词弱化：每文节只有 head 加粗
    expect(bs[0].romajiParts).toEqual([
      { text: "futari", head: true },
      { text: "dake", head: false },
      { text: "no", head: false },
    ]);
  });

  it("跨 token 促音：分かっ+た → wakatta（合并为一段）", () => {
    const bs = segmentBunsetsu([
      tok("分かっ", "動詞", "わかっ"),
      tok("た", "助動詞", "た"),
    ]);
    expect(bs.map((b) => b.text)).toEqual(["分かった"]);
    expect(bs[0].romaji).toBe("wakatta");
    expect(bs[0].romajiParts).toEqual([{ text: "wakatta", head: true }]);
  });

  it("接头辞并入内容词：お+花 → お花", () => {
    const bs = segmentBunsetsu([tok("お", "接頭詞", "お"), tok("花", "名詞", "はな")]);
    expect(bs.map((b) => b.text)).toEqual(["お花"]);
    expect(bs[0].romaji).toBe("o hana");
  });

  it("連体詞开新文节：この | 本", () => {
    const bs = segmentBunsetsu([
      tok("この", "連体詞", "この"),
      tok("本", "名詞", "ほん"),
    ]);
    expect(bs.map((b) => b.text)).toEqual(["この", "本"]);
    expect(bs.map((b) => b.romaji)).toEqual(["kono", "hon"]);
  });

  it("行首助词开纯附属文节（headIndex = -1）", () => {
    const bs = segmentBunsetsu([
      tok("が", "助詞", "が"),
      tok("好き", "形容動詞", "すき"),
    ]);
    expect(bs.map((b) => b.text)).toEqual(["が", "好き"]);
    expect(bs[0].headIndex).toBe(-1);
    expect(bs[0].romajiParts).toEqual([{ text: "ga", head: false }]);
  });

  it("記号追加到当前文节，且不产生罗马音", () => {
    const bs = segmentBunsetsu([
      tok("ね", "助詞", "ね"),
      tok("、", "記号", null),
    ]);
    expect(bs.map((b) => b.text)).toEqual(["ね、"]);
    expect(bs[0].romaji).toBe("ne");
  });

  it("助词 は→wa、へ→e", () => {
    const bs = segmentBunsetsu([
      tok("夜", "名詞", "よる"),
      tok("は", "助詞", "は"),
      tok("海", "名詞", "うみ"),
      tok("へ", "助詞", "へ"),
    ]);
    expect(bs.map((b) => b.romaji)).toEqual(["yoru wa", "umi e"]);
    expect(bs[0].romajiParts).toEqual([
      { text: "yoru", head: true },
      { text: "wa", head: false },
    ]);
  });

  it("寒暄语 こんにちは → konnichiwa", () => {
    const bs = segmentBunsetsu([tok("こんにちは", "感動詞", "こんにちは")]);
    expect(bs[0].romaji).toBe("konnichiwa");
  });

  it("纯记号行 → 一个无罗马音的文节", () => {
    const bs = segmentBunsetsu([
      tok("♪", "記号", null),
      tok("～", "記号", null),
    ]);
    expect(bs).toHaveLength(1);
    expect(bs[0].text).toBe("♪～");
    expect(bs[0].romaji).toBe("");
    expect(bs[0].headIndex).toBe(-1);
  });
});
