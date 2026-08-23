import { describe, expect, it } from "vitest";
import { alignSurfaceToReading, groupRuns } from "./align";

// 注意：kanji 段现在额外带 kana 字段（注音「假名」档），断言用 toMatchObject 部分匹配
function seg(text: string, reading: string | null, kind: "kanji" | "kana" | "other") {
  return { text, reading, kind };
}

describe("groupRuns 表面形分组", () => {
  it("连续同型字符合并", () => {
    expect(groupRuns("聴かない")).toMatchObject([
      { type: "kanji", text: "聴" },
      { type: "kana", text: "かない" },
    ]);
  });
  it("全片假名归 kana", () => {
    expect(groupRuns("ドライブ")).toMatchObject([{ type: "kana", text: "ドライブ" }]);
  });
  it("标点/♪/空格归 other", () => {
    expect(groupRuns("♪ 晴れ")).toMatchObject([
      { type: "other", text: "♪ " },
      { type: "kanji", text: "晴" },
      { type: "kana", text: "れ" },
    ]);
  });
});

describe("alignSurfaceToReading 锚点法", () => {
  it("聴か + きか → 聴=ki", () => {
    const { segments, warnings } = alignSurfaceToReading("聴か", "きか");
    expect(segments).toMatchObject([
      seg("聴", "ki", "kanji"),
      seg("か", null, "kana"),
    ]);
    expect(warnings).toMatchObject([]);
  });

  it("開け放つ + あけはなつ → 開=a / 放=hana + つ", () => {
    const { segments, warnings } = alignSurfaceToReading("開け放つ", "あけはなつ");
    expect(segments).toMatchObject([
      seg("開", "a", "kanji"),
      seg("け", null, "kana"),
      seg("放", "hana", "kanji"),
      seg("つ", null, "kana"),
    ]);
    expect(warnings).toMatchObject([]);
  });

  it("纯汉字整段读音：学校 + がっこう", () => {
    const { segments } = alignSurfaceToReading("学校", "がっこう");
    expect(segments).toMatchObject([seg("学校", "gakkou", "kanji")]);
  });

  it("行こう + いこう → 行=i", () => {
    const { segments } = alignSurfaceToReading("行こう", "いこう");
    expect(segments).toMatchObject([
      seg("行", "i", "kanji"),
      seg("こう", null, "kana"),
    ]);
  });

  it("泣きそうな顔 + なきそうなかお", () => {
    const { segments, warnings } = alignSurfaceToReading("泣きそうな顔", "なきそうなかお");
    expect(segments).toMatchObject([
      seg("泣", "na", "kanji"),
      seg("きそうな", null, "kana"),
      seg("顔", "kao", "kanji"),
    ]);
    expect(warnings).toMatchObject([]);
  });

  it("促音/浊化：泳いで + およいで → 泳=oyo", () => {
    const { segments } = alignSurfaceToReading("泳いで", "およいで");
    expect(segments).toMatchObject([
      seg("泳", "oyo", "kanji"),
      seg("いで", null, "kana"),
    ]);
  });

  it("纯假名不标注（きょう）", () => {
    const { segments } = alignSurfaceToReading("きょう", "きょう");
    expect(segments).toMatchObject([seg("きょう", null, "kana")]);
  });

  it("外来语全片假名不标注", () => {
    const { segments } = alignSurfaceToReading("ドライブ", "どらいぶ");
    expect(segments).toMatchObject([seg("ドライブ", null, "kana")]);
  });

  it("片假名外来语锚点经平假名匹配，无 warning（フェンス）", () => {
    const { segments, warnings } = alignSurfaceToReading("フェンス", "ふぇんす");
    expect(segments).toMatchObject([seg("フェンス", null, "kana")]);
    expect(warnings).toMatchObject([]);
  });

  it("汉字读音与后随假名同字时仍取到读音（言い + いい）", () => {
    const { segments, warnings } = alignSurfaceToReading("言い", "いい");
    expect(segments).toMatchObject([
      seg("言", "i", "kanji"),
      seg("い", null, "kana"),
    ]);
    expect(warnings).toMatchObject([]);
  });

  it("无读音含汉字 → null + warning", () => {
    const { segments, warnings } = alignSurfaceToReading("漢字", null);
    expect(segments).toMatchObject([seg("漢字", null, "kanji")]);
    expect(warnings).toHaveLength(1);
  });

  it("无读音纯假名 → 不标注、无 warning", () => {
    const { segments, warnings } = alignSurfaceToReading("かな", null);
    expect(segments).toMatchObject([seg("かな", null, "kana")]);
    expect(warnings).toMatchObject([]);
  });

  it("♪ 归 other", () => {
    const { segments } = alignSurfaceToReading("♪", "♪");
    expect(segments).toMatchObject([seg("♪", null, "other")]);
  });

  it("锚点找不到（音便降级）→ 整段归汉字并记 warning", () => {
    const { segments, warnings } = alignSurfaceToReading("開け放つ", "ひらきはなつ");
    expect(segments[0]).toMatchObject(seg("開", "hirakihanatsu", "kanji"));
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("読めない 的 読め + よめ → 読=yo", () => {
    const { segments } = alignSurfaceToReading("読め", "よめ");
    expect(segments).toMatchObject([
      seg("読", "yo", "kanji"),
      seg("め", null, "kana"),
    ]);
  });
});
