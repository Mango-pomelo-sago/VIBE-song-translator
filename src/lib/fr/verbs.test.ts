import { describe, expect, it } from "vitest";
import {
  describeVerbZh,
  grammarCategory,
  grammarTag,
  parseInfover,
  tenseLabelZh,
} from "./verbs";

describe("grammarTag", () => {
  it("名词用阴阳性 + 复数缩写", () => {
    expect(grammarTag({ pos: "NOUN", gender: "f", number: "pl" })).toBe("阴复");
    expect(grammarTag({ pos: "NOUN", gender: "m", number: "sg" })).toBe("阳");
  });

  it("形容词显示性数配合", () => {
    expect(grammarTag({ pos: "ADJ", gender: "f", number: "sg" })).toBe("形·阴");
    expect(grammarTag({ pos: "ADJ", gender: "m", number: "pl" })).toBe("形·阳复");
  });

  it("动词显示时态与人称", () => {
    const v = parseInfover("ind:pre:3s", "chanter");
    expect(grammarTag({ pos: "VERB", verb: v })).toBe("现·3单");
  });

  it("虚拟式/条件式保留语式前缀", () => {
    expect(
      grammarTag({ pos: "VERB", verb: parseInfover("sub:pre:1p", "aller") }),
    ).toBe("虚拟·现·1复");
    expect(
      grammarTag({ pos: "VERB", verb: parseInfover("cnd:pre:2s", "aller") }),
    ).toBe("条件·现·2单");
  });

  it("不定式与分词使用短标签", () => {
    expect(grammarTag({ pos: "VERB", verb: parseInfover("inf", "chanter") })).toBe(
      "不定式",
    );
    expect(grammarTag({ pos: "VERB", verb: parseInfover("par:pas", "chanter") })).toBe(
      "过去分",
    );
  });

  it("功能词没有标签", () => {
    expect(grammarTag({ pos: "DET", gender: "m", number: "sg" })).toBeNull();
  });
});

describe("grammarCategory", () => {
  it("名词按阴阳性分组", () => {
    expect(grammarCategory({ pos: "NOUN", gender: "m" })).toBe("m");
    expect(grammarCategory({ pos: "NOUN", gender: "f" })).toBe("f");
    expect(grammarCategory({ pos: "NOUN", gender: null })).toBeNull();
  });

  it("动词（含助动词）、形容词、副词各自分组", () => {
    expect(grammarCategory({ pos: "VERB" })).toBe("verb");
    expect(grammarCategory({ pos: "AUX" })).toBe("verb");
    expect(grammarCategory({ pos: "ADJ" })).toBe("adj");
    expect(grammarCategory({ pos: "ADV" })).toBe("adv");
    expect(grammarCategory({ pos: "PRON" })).toBeNull();
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

describe("tenseLabelZh", () => {
  it("区分不定式、分词与普通时态", () => {
    expect(tenseLabelZh(parseInfover("inf", "chanter")!)).toBe("不定式");
    expect(tenseLabelZh(parseInfover("par:pas", "chanter")!)).toBe("过去分词");
    expect(tenseLabelZh(parseInfover("ind:imp:1s", "chanter")!)).toBe(
      "未完成过去时",
    );
  });
});
