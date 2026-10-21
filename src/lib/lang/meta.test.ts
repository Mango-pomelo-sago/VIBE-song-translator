import { describe, expect, it } from "vitest";
import {
  LANG_CODES,
  LANG_META,
  annotationModeFor,
  isContentPos,
  isLangCode,
  normalizeLang,
} from "./meta";

describe("lang/meta", () => {
  it("两种语言都有完整元数据", () => {
    for (const code of LANG_CODES) {
      expect(LANG_META[code].tabLabel).toBeTruthy();
      expect(LANG_META[code].uiName).toBeTruthy();
      expect(LANG_META[code].locale).toMatch(/-(JP|FR)$/);
    }
  });

  it("normalizeLang 缺省日语，非法值也回落日语", () => {
    expect(normalizeLang("fr")).toBe("fr");
    expect(normalizeLang("ja")).toBe("ja");
    expect(normalizeLang(undefined)).toBe("ja");
    expect(normalizeLang("en")).toBe("ja");
  });

  it("isLangCode", () => {
    expect(isLangCode("fr")).toBe(true);
    expect(isLangCode("de")).toBe(false);
  });

  it("isContentPos 按语言区分", () => {
    expect(isContentPos("fr", "NOUN")).toBe(true);
    expect(isContentPos("fr", "VERB")).toBe(true);
    expect(isContentPos("fr", "DET")).toBe(false);
    expect(isContentPos("ja", "名詞")).toBe(true);
    expect(isContentPos("ja", "助詞")).toBe(false);
  });

  it("法语下 kana 档回落到 romaji（IPA）", () => {
    expect(annotationModeFor("fr", "kana")).toBe("romaji");
    expect(annotationModeFor("fr", "hidden")).toBe("hidden");
    expect(annotationModeFor("ja", "kana")).toBe("kana");
  });
});
