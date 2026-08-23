import { describe, expect, it } from "vitest";
import { tokenRomaji } from "./romaji";

describe("tokenRomaji 助词例外", () => {
  it("は → wa（助词）", () => {
    expect(tokenRomaji("は", "は", "助詞")).toBe("wa");
  });
  it("へ → e（助词）", () => {
    expect(tokenRomaji("へ", "へ", "助詞")).toBe("e");
  });
  it("を → o（助词）", () => {
    expect(tokenRomaji("を", "を", "助詞")).toBe("o");
  });
  it("非助词 は 保持 ha", () => {
    expect(tokenRomaji("は", "は", "名詞")).toBe("ha");
  });
});

describe("tokenRomaji 寒暄语修正", () => {
  it("こんにちは → konnichiwa", () => {
    expect(tokenRomaji("こんにちは", "こんにちは", "感動詞")).toBe("konnichiwa");
  });
  it("こんばんは → konbanwa", () => {
    expect(tokenRomaji("こんばんは", "こんばんは", "感動詞")).toBe("konbanwa");
  });
});

describe("tokenRomaji 常规", () => {
  it("促音：がっこう → gakkou", () => {
    expect(tokenRomaji("がっこう", "学校", "名詞")).toBe("gakkou");
  });
  it("拗音：いっしょ → issho", () => {
    expect(tokenRomaji("いっしょ", "一緒", "名詞")).toBe("issho");
  });
  it("长音：とうきょう → toukyou", () => {
    expect(tokenRomaji("とうきょう", "東京", "名詞")).toBe("toukyou");
  });
  it("无读音纯假名 → 按表面形转写（外来语）", () => {
    expect(tokenRomaji(null, "ドライブ", "名詞")).toBe("doraibu");
  });
  it("无读音含汉字 → null", () => {
    expect(tokenRomaji(null, "漢字", "名詞")).toBeNull();
  });
});
