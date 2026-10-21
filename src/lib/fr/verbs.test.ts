import { describe, expect, it } from "vitest";
import { describeVerbZh, grammarTag, parseInfover } from "./verbs";

describe("grammarTag", () => {
  it("名词显示阴阳性与复数", () => {
    expect(grammarTag({ pos: "NOUN", gender: "f", number: "pl" })).toBe("n. f. pl.");
    expect(grammarTag({ pos: "NOUN", gender: "m", number: "sg" })).toBe("n. m.");
  });

  it("形容词显示阴阳性", () => {
    expect(grammarTag({ pos: "ADJ", gender: "f", number: "sg" })).toBe("adj. f.");
  });

  it("动词显示时态与人称", () => {
    const v = parseInfover("ind:pre:3s", "chanter");
    expect(grammarTag({ pos: "VERB", verb: v })).toBe("v. prés. 3s");
  });

  it("不定式与分词使用短标签", () => {
    expect(grammarTag({ pos: "VERB", verb: parseInfover("inf", "chanter") })).toBe("inf.");
    expect(grammarTag({ pos: "VERB", verb: parseInfover("par:pas", "chanter") })).toBe(
      "part. passé",
    );
  });

  it("功能词没有标签", () => {
    expect(grammarTag({ pos: "DET", gender: "m", number: "sg" })).toBeNull();
  });
});

describe("describeVerbZh", () => {
  it("中文描述直陈式现在时与人称", () => {
    expect(describeVerbZh(parseInfover("ind:pre:1s", "aller")!)).toBe(
      "直陈式现在时 · 第一人称单数",
    );
  });

  it("分词只描述语式与时态", () => {
    expect(describeVerbZh(parseInfover("par:pas", "chanter")!)).toBe("分词过去");
  });

  it("不定式不附带现在时", () => {
    expect(describeVerbZh(parseInfover("inf", "chanter")!)).toBe("不定式");
  });
});
